const Log = require("logger");
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

        try {
            if (fs.existsSync(TOKEN_FILE)) {
                const data = fs.readFileSync(TOKEN_FILE, "utf8");
                const tokenData = JSON.parse(data);
                if (tokenData?.refresh_token) this.refreshToken = tokenData.refresh_token;
                Log.debug("Refresh token loaded");
            }
        } catch (err) {
            Log.error("Error loading refresh token", err);
        }

        this.tadoClient.setTokenCallback((token) => {
            if (token?.refresh_token) {
                this.refreshToken = token.refresh_token;
                try {
                    fs.writeFileSync(TOKEN_FILE, JSON.stringify(token), "utf8");
                    Log.debug("Refresh token saved");
                } catch (err) {
                    Log.error("Error saving refresh token", err);
                }
            }
        });

        try {
            await this.authenticate();
        } catch (err) {
            Log.error("Authentication error", err);
        }
    },

    authenticate: async function () {
        try {
            const [verify, futureToken] = await this.tadoClient.authenticate(this.refreshToken);

            if (verify) {
                Log.log("Device authentication required");
                Log.log("Open this URL to authenticate:", verify.verification_uri_complete);
            }

            await futureToken;
            this.authenticated = true;
            Log.log("Successfully authenticated");
        } catch (err) {
            Log.error("Authentication failed:", err);
        }
    },

    getData: async function () {
        if (!this.authenticated || this.fetching) return;

        const now = Date.now();
        if (this.cache && now - this.cacheTimestamp < this.cacheTTL) {
            this.sendSocketNotification("NEW_DATA", { ...this.cache, lastUpdate: this.cacheTimestamp });
            Log.debug("Using cached data");
            return;
        }

        this.fetching = true;
        try {
            Log.debug("Fetching Tado data...");

            this.tadoMe = await this.tadoClient.getMe();
            Log.debug("Retrieved homes:", this.tadoMe.homes.map(h => h.name));

            this.tadoHomes = [];

            for (const home of this.tadoMe.homes) {
                Log.debug(`Fetching zones for home "${home.name}"`);
                const zones = await this.tadoClient.getZones(home.id);

                const zonesToFetch = this.showZones.length
                    ? zones.filter(z => this.showZones.includes(z.name))
                    : zones;

                const results = [];
                for (const zone of zonesToFetch) {
                    try {
                        const state = await this.tadoClient.getZoneState(home.id, zone.id);
                        results.push({ id: zone.id, name: zone.name, type: zone.type, state });
                        Log.debug(`Zone "${zone.name}" state fetched`);
                    } catch (err) {
                        Log.error(`Failed fetching zone "${zone.name}"`, err);
                    }
                }

                this.tadoHomes.push({ id: home.id, name: home.name, zones: results });
            }

            const data = { tadoMe: this.tadoMe, tadoHomes: this.tadoHomes, lastUpdate: Date.now() };
            this.cache = data;
            this.cacheTimestamp = Date.now();

            this.sendSocketNotification("NEW_DATA", data);
            Log.debug("Data sent to frontend");

        } catch (err) {
            Log.error("Error in getData:", err);
        } finally {
            this.fetching = false;
        }
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "CONFIG") {
            // Merge defaults with payload
            this.config = Object.assign({
                updateInterval: 1800000,
                showZones: [],
                showHomeName: true,
                showColumnHeaders: true,
                useColors: true,
                showLastUpdate: true,
                zoneColumnName: "ZONE",
                tempColumnName: "TEMP (°C)",
                humidityColumnName: "",
                statusColumnName: "STATUS",
                lastUpdateName: "Last update"
            }, payload);

            this.showZones = this.config.showZones || [];

            Log.debug("Config received:", this.config);

            // Immediately fetch data
            this.getData();

            // Repeat on interval
            setInterval(() => this.getData(), this.config.updateInterval || 300000);
        }
    }
});
