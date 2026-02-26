const NodeHelper = require("node_helper");
const { Tado } = require("node-tado-client");
const fs = require("fs");
const path = require("path");

const TOKEN_FILE = path.join(__dirname, "tado_refresh_token.json");

module.exports = NodeHelper.create({
    tadoClient: null,
    tadoMe: {},
    tadoHomes: [],
    refreshToken: null,
    authenticated: false,
    fetching: false,
    showZones: [],

    cache: null,
    cacheTimestamp: 0,
    cacheTTL: 60 * 1000, // 60 seconds

    start: async function () {
        this.tadoClient = new Tado();

        // Load saved refresh token
        if (fs.existsSync(TOKEN_FILE)) {
            try {
                const data = fs.readFileSync(TOKEN_FILE, "utf8");
                const tokenData = JSON.parse(data);
                if (tokenData && tokenData.refresh_token) {
                    this.refreshToken = tokenData.refresh_token;
                    console.log("MMM-MyTado: Refresh token loaded.");
                }
            } catch (err) {
                console.error("MMM-MyTado: Error loading refresh token", err);
            }
        }

        // Save new tokens automatically
        this.tadoClient.setTokenCallback((token) => {
            if (token && token.refresh_token) {
                this.refreshToken = token.refresh_token;
                try {
                    fs.writeFileSync(TOKEN_FILE, JSON.stringify(token), "utf8");
                    console.log("MMM-MyTado: Refresh token saved.");
                } catch (err) {
                    console.error("MMM-MyTado: Error saving refresh token", err);
                }
            }
        });

        await this.authenticate();
    },

    authenticate: async function () {
        try {
            const [verify, futureToken] =
                await this.tadoClient.authenticate(this.refreshToken);

            if (verify) {
                console.log("MMM-MyTado: Device authentication required.");
                console.log("Open this URL to authenticate:");
                console.log(verify.verification_uri_complete);
            }

            await futureToken;
            this.authenticated = true;
            console.log("MMM-MyTado: Successfully authenticated.");
        } catch (err) {
            console.error("MMM-MyTado: Authentication failed:", err);
        }
    },

    getData: async function () {
        if (!this.authenticated || this.fetching) return;

        const now = Date.now();
        if (this.cache && now - this.cacheTimestamp < this.cacheTTL) {
            // Return cached data
            this.sendSocketNotification("NEW_DATA", this.cache);
            return;
        }

        this.fetching = true;
        try {
            const delay = ms => new Promise(r => setTimeout(r, ms));

            this.tadoMe = await this.tadoClient.getMe();
            this.tadoHomes = [];

            for (const home of this.tadoMe.homes) {
                const homeInfo = { id: home.id, name: home.name, zones: [] };
                this.tadoHomes.push(homeInfo);

                const zones = await this.tadoClient.getZones(home.id);

                // Filter zones on showZones
                const zonesToFetch = this.showZones.length > 0
                    ? zones.filter(z => this.showZones.includes(z.name))
                    : zones;

                const maxConcurrent = 5;
                const results = [];
                for (let i = 0; i < zonesToFetch.length; i += maxConcurrent) {
                    const batch = zonesToFetch.slice(i, i + maxConcurrent);
                    const batchResults = await Promise.all(
                        batch.map(async (zone) => {
                            try {
                                const state = await this.tadoClient.getZoneState(home.id, zone.id);
                                return { id: zone.id, name: zone.name, type: zone.type, state };
                            } catch (err) {
                                console.error(`MMM-MyTado: Failed fetching zone ${zone.name}`, err);
                                return null;
                            }
                        })
                    );
                    results.push(...batchResults.filter(r => r !== null));
                    await delay(200); // short break between batches
                }
                homeInfo.zones = results;
            }

            const data = {
                tadoMe: this.tadoMe,
                tadoHomes: this.tadoHomes
            };

            // 🔥 Save Cache
            this.cache = data;
            this.cacheTimestamp = Date.now();

            this.sendSocketNotification("NEW_DATA", data);

            console.log("MMM-MyTado: Data sent to frontend.");
        } catch (err) {
            console.error("MMM-MyTado: Error in getData:", err);
        } finally {
            this.fetching = false;
        }
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "CONFIG") {
            this.config = payload;
            this.showZones = payload.showZones || [];

            this.getData();

            setInterval(() => this.getData(), this.config.updateInterval || 300000);
        }
    }
});
