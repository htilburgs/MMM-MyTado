const NodeHelper = require("node_helper");
const { Tado } = require("node-tado-client");
const fs = require("fs");
const path = require("path");

const TOKEN_FILE = path.join(__dirname, "tado_refresh_token.json");

module.exports = NodeHelper.create({
    tadoClient: null,
    refreshToken: null,
    authenticated: false,
    fetching: false,
    showZones: [],
    apiRateLimit: {
        limit: null,
        remaining: null,
        reset: null
    },

    start: async function () {
        console.log("MMM-MyTado: Node helper started");

        this.tadoClient = new Tado();

        // Load saved refresh token
        if (fs.existsSync(TOKEN_FILE)) {
            try {
                const data = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
                this.refreshToken = data.refresh_token || null;
                console.log("MMM-MyTado: Refresh token loaded");
            } catch (err) {
                console.error("MMM-MyTado: Failed to load token", err);
            }
        }

        // Auto-save tokens
        this.tadoClient.setTokenCallback((token) => {
            if (token?.refresh_token) {
                this.refreshToken = token.refresh_token;
                try {
                    fs.writeFileSync(TOKEN_FILE, JSON.stringify(token), "utf8");
                    console.log("MMM-MyTado: Refresh token saved");
                } catch (err) {
                    console.error("MMM-MyTado: Failed saving token", err);
                }
            }
        });

        await this.authenticate();
    },

    // =============================
    // AUTHENTICATION
    // =============================
    authenticate: async function () {
        try {
            const [verify, futureToken] = await this.tadoClient.authenticate(this.refreshToken);
            if (verify) {
                console.log("MMM-MyTado: Device authorization required:");
                console.log(verify.verification_uri_complete);
            }
            await futureToken;
            this.authenticated = true;
            console.log("MMM-MyTado: Authenticated");
        } catch (err) {
            this.authenticated = false;
            console.error("MMM-MyTado: Authentication failed", err);
        }
    },

    ensureAuth: async function () {
        if (!this.authenticated) await this.authenticate();
    },

    // =============================
    // PARSE RATE LIMIT HEADERS
    // =============================
    parseRateLimit: function (response) {
        if (!response?.headers) return;
        const h = {};
        Object.keys(response.headers).forEach(k => h[k.toLowerCase()] = response.headers[k]);
        this.apiRateLimit.limit = h["x-ratelimit-limit"] ?? null;
        this.apiRateLimit.remaining = h["x-ratelimit-remaining"] ?? null;
        this.apiRateLimit.reset = h["x-ratelimit-reset"] ?? null;
    },

    // =============================
    // DATA FETCH
    // =============================
    getData: async function () {
        if (this.fetching) return;
        await this.ensureAuth();
        if (!this.authenticated) return;
        this.fetching = true;

        try {
            const delay = ms => new Promise(r => setTimeout(r, ms));

            // --- GET ME with safe fallback ---
            let meResponse;
            try {
                // probeer raw headers
                meResponse = await this.tadoClient.getMe({ raw: true });
            } catch (err) {
                console.warn("MMM-MyTado: getMe({raw:true}) failed, fallback to normal getMe");
                meResponse = await this.tadoClient.getMe();
            }

            let me;
            if (meResponse?.data) {
                me = meResponse.data;
                this.parseRateLimit(meResponse);
            } else {
                me = meResponse;
            }

            if (!me?.homes) {
                console.error("MMM-MyTado: No homes found in response");
                this.fetching = false;
                return;
            }

            const homesOut = [];

            for (const home of me.homes) {
                const homeInfo = { id: home.id, name: home.name, zones: [] };
                const zones = await this.tadoClient.getZones(home.id);

                const zonesToFetch = this.showZones.length > 0
                    ? zones.filter(z => this.showZones.includes(z.name))
                    : zones;

                const maxConcurrent = 5;
                for (let i = 0; i < zonesToFetch.length; i += maxConcurrent) {
                    const batch = zonesToFetch.slice(i, i + maxConcurrent);
                    const results = await Promise.all(batch.map(async zone => {
                        try {
                            const state = await this.tadoClient.getZoneState(home.id, zone.id);
                            return { id: zone.id, name: zone.name, type: zone.type, state };
                        } catch (err) {
                            console.error(`MMM-MyTado: Zone fetch failed (${zone.name})`, err.message);
                            return null;
                        }
                    }));
                    homeInfo.zones.push(...results.filter(r => r !== null));
                    await delay(200);
                }

                homesOut.push(homeInfo);
            }

            this.sendSocketNotification("NEW_DATA", {
                tadoHomes: homesOut,
                apiRateLimit: this.apiRateLimit
            });

            console.log("MMM-MyTado: Data sent");
        } catch (err) {
            if (err?.response?.status === 401) {
                console.log("MMM-MyTado: Token expired — reauth");
                this.authenticated = false;
                await this.authenticate();
            } else if (err?.response?.status === 429) {
                console.warn("MMM-MyTado: Rate limited");
            } else {
                console.error("MMM-MyTado: getData error", err);
            }
        } finally {
            this.fetching = false;
        }
    },

    // =============================
    // SOCKET
    // =============================
    socketNotificationReceived: function (notification, payload) {
        if (notification === "CONFIG") {
            this.config = payload;
            this.showZones = payload.showZones || [];
            this.getData();
            setInterval(() => this.getData(), this.config.updateInterval || 300000);
        }
    }
});
