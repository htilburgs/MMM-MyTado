const NodeHelper = require("node_helper");
const { Tado } = require("node-tado-client");
const fs = require("fs");
const path = require("path");

module.exports = NodeHelper.create({

    start() {
        console.log("MMM-MyTado node_helper gestart");

        this.tado = new Tado();
        this.config = null;
        this.homeId = null;
        this.previousPayload = null;
        this.updateTimer = null;

        this.tokenFile = path.join(__dirname, "tado_refresh_token.json");
    },

    socketNotificationReceived(notification, payload) {
        if (notification === "TADO_INIT") {
            console.log("TADO_INIT ontvangen");
            this.config = payload;
            this.initialize();
        }
    },

    // ================================
    // 🔐 INITIALIZE + AUTH
    // ================================
    async initialize() {
        try {
            console.log("Initialize gestart");

            let refreshToken = null;

            // bestaande token laden
            if (fs.existsSync(this.tokenFile)) {
                try {
                    const json = JSON.parse(fs.readFileSync(this.tokenFile));
                    refreshToken = json.refreshToken;
                    console.log("Refresh token geladen");
                } catch (e) {
                    console.error("Token bestand corrupt, opnieuw authenticeren");
                }
            }

            // OAuth device flow
            const [verify, futureToken] = await this.tado.authenticate(refreshToken);

            if (verify) {
                console.log("====================================");
                console.log("👉 Autoriseer Tado via deze URL:");
                console.log(verify.verification_uri_complete);
                console.log("====================================");
            }

            const token = await futureToken;

            // token opslaan
            fs.writeFileSync(this.tokenFile, JSON.stringify(token, null, 2));
            console.log("Refresh token opgeslagen");

            // gebruiker ophalen
            const me = await this.tado.getMe();
            console.log(`Ingelogd als: ${me.email}`);

            if (!me.homes || me.homes.length === 0) {
                console.error("Geen homes gevonden!");
                return;
            }

            this.homeId = me.homes[0].id;
            console.log(`Home actief: ${me.homes[0].name} (${this.homeId})`);

            // eerste update
            await this.checkForUpdates();

            // polling starten
            const interval = this.config.updateInterval || 15000;
            console.log(`Polling gestart: ${interval} ms`);

            this.updateTimer = setInterval(
                () => this.checkForUpdates(),
                interval
            );

        } catch (err) {
            console.error("Fout bij initialize():", err);
        }
    },

    // ================================
    // 🔄 DATA UPDATE
    // ================================
    async checkForUpdates() {
        if (!this.homeId) {
            console.warn("checkForUpdates overgeslagen: geen homeId");
            return;
        }

        try {
            console.log("checkForUpdates gestart");

            // zones ophalen
            const zones = await this.tado.getZones(this.homeId);

            // presence ophalen (correct voor v1.1.1)
            const homeState = await this.tado.getState(this.homeId);

            // 🔥 parallel zone states
            const zoneStates = await Promise.all(
                zones.map(async (zone) => {
                    try {
                        const st = await this.tado.getState(this.homeId, zone.id);

                        return {
                            name: zone.name,
                            currentTemp: st.sensorDataPoints?.insideTemperature?.celsius ?? null,
                            targetTemp: st.setting?.temperature?.celsius ?? null,
                            heating: (st.activityDataPoints?.heatingPower?.percentage ?? 0) > 0,
                            openWindow: Array.isArray(st.openWindowDetected)
                                ? st.openWindowDetected.length > 0
                                : false
                        };

                    } catch (zoneErr) {
                        console.error(`Zone fout (${zone.name}):`, zoneErr);
                        return null;
                    }
                })
            );

            const payload = {
                zones: zoneStates.filter(Boolean),
                presence: homeState?.presence || "UNKNOWN",
                timestamp: Date.now()
            };

            // alleen pushen bij wijziging
            if (JSON.stringify(payload) !== JSON.stringify(this.previousPayload)) {
                this.previousPayload = payload;
                this.sendSocketNotification("TADO_UPDATE", payload);
                console.log("✅ Nieuwe data naar frontend gestuurd");
            } else {
                console.log("ℹ️ Geen wijzigingen");
            }

        } catch (err) {
            console.error("Fout bij checkForUpdates():", err);
        }
    }

});
