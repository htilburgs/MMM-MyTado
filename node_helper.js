const NodeHelper = require("node_helper");
const { Tado } = require("node-tado-client");
const logger = require("mocha-logger");
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

    start: async function () {
        this.tadoClient = new Tado();

        // Load saved refresh token
        if (fs.existsSync(TOKEN_FILE)) {
            try {
                const data = fs.readFileSync(TOKEN_FILE, "utf8");
                const tokenData = JSON.parse(data);
                if (tokenData && tokenData.refresh_token) {
                    this.refreshToken = tokenData.refresh_token;
                    logger.log("MMM-Tado: Refresh token loaded.");
                }
            } catch (err) {
                logger.error("MMM-Tado: Error loading refresh token", err);
            }
        } else {
            logger.log("MMM-Tado: No saved refresh token found.");
        }

        // Save new tokens automatically
        this.tadoClient.setTokenCallback((token) => {
            if (token && token.refresh_token) {
                this.refreshToken = token.refresh_token;
                try {
                    fs.writeFileSync(TOKEN_FILE, JSON.stringify(token), "utf8");
                    logger.log("MMM-Tado: Refresh token saved.");
                } catch (err) {
                    logger.error("MMM-Tado: Error saving refresh token", err);
                }
            }
        });

        // Authenticate once
        await this.authenticate();
    },

    authenticate: async function () {
        try {
            const [verify, futureToken] =
                await this.tadoClient.authenticate(this.refreshToken);

            if (verify) {
                logger.log("MMM-Tado: Device authentication required.");
                logger.log("Open deze URL om te autoriseren:");
                logger.log(verify.verification_uri_complete);
            }

            await futureToken;
            this.authenticated = true;
            logger.log("MMM-Tado: Successfully authenticated.");
        } catch (err) {
            logger.error("MMM-Tado: Authentication failed:", err);
        }
    },

    getData: async function () {
        if (!this.authenticated) {
            logger.log("MMM-Tado: Not authenticated yet.");
            return;
        }

        if (this.fetching) {
            logger.log("MMM-Tado: Previous fetch still running — skipping.");
            return;
        }

        this.fetching = true;

        try {
            const delay = (ms) => new Promise((r) => setTimeout(r, ms));

            // Get user info
            this.tadoMe = await this.tadoClient.getMe();

            this.tadoHomes = [];

            for (const home of this.tadoMe.homes) {
                const homeInfo = {
                    id: home.id,
                    name: home.name,
                    zones: []
                };
                this.tadoHomes.push(homeInfo);

                const zones = await this.tadoClient.getZones(home.id);

                // 🔥 Parallel fetch of all zones
                const zoneStates = await Promise.all(
                    zones.map(async (zone) => {
                        try {
                            const state = await this.tadoClient.getZoneState(home.id, zone.id);
                            return {
                                id: zone.id,
                                name: zone.name,
                                type: zone.type,
                                state: state
                            };
                        } catch (err) {
                            logger.error(`MMM-Tado: Failed fetching zone ${zone.name}`, err);
                            return null;
                        }
                    })
                );

                // Filter out any failed zones
                homeInfo.zones = zoneStates.filter(z => z !== null);

                // Optional delay to avoid API rate limit
                await delay(200);
            }

            // Send to frontend
            this.sendSocketNotification("NEW_DATA", {
                tadoMe: this.tadoMe,
                tadoHomes: this.tadoHomes
            });

            logger.log("MMM-Tado: Data sent to frontend.");
        } catch (err) {
            logger.error("MMM-Tado: Error in getData:", err);
        } finally {
            this.fetching = false;
        }
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "CONFIG") {
            this.config = payload;

            // Initial fetch
            this.getData();

            // Polling interval (recommend 2–5 minutes)
            setInterval(() => {
                this.getData();
            }, this.config.updateInterval || 300000);
        }
    }
});
