const NodeHelper = require("node_helper");
const { Tado } = require("node-tado-client");
const fs = require("fs");
const path = require("path");

module.exports = NodeHelper.create({

    start() {
        console.log("MMM-MyTado node_helper gestart...");
        this.tado = new Tado();
        this.homeId = null;
        this.previousPayload = null;

        // Bestand om refresh token op te slaan
        this.tokenFile = path.join(__dirname, "tado_refresh_token.json");
    },

    async socketNotificationReceived(notification, payload) {
        if (notification === "TADO_INIT") {
            console.log("TADO_INIT ontvangen van frontend!");
            this.config = payload;
            await this.initialize();
        }
    },

    async initialize() {
        try {
            console.log("Initialize gestart...");

            let refreshToken = null;
            // Lees refresh token als die al eerder opgeslagen is
            if (fs.existsSync(this.tokenFile)) {
                const content = fs.readFileSync(this.tokenFile, "utf-8");
                const json = JSON.parse(content);
                refreshToken = json.refreshToken;
                console.log("Refresh token gevonden.");
            }

            // OAuth2 device authorization flow
            const [verify, futureToken] = await this.tado.authenticate(refreshToken);

            if (verify) {
                console.log("💻 Open deze URL in je browser om Tado te autoriseren:");
                console.log(verify.verification_uri_complete);
            }

            const token = await futureToken; // wacht tot user autoriseert
            fs.writeFileSync(this.tokenFile, JSON.stringify(token, null, 2));
            console.log("Refresh token opgeslagen.");

            // Nu kan de client gebruikt worden
            const me = await this.tado.getMe();
            console.log(`Gebruiker: ${me.email}`);

            // Pak de eerste home
            if (!me.homes || me.homes.length === 0) {
                console.error("Geen homes gevonden in Tado account!");
                return;
            }
            this.homeId = me.homes[0].id;
            console.log(`Home gevonden: ${me.homes[0].name} (ID: ${this.homeId})`);

            // Eerste update
            await this.checkForUpdates();

            // Polling
            const interval = this.config.updateInterval || 15000;
            console.log(`Polling elke ${interval / 1000} seconden`);
            setInterval(() => this.checkForUpdates(), interval);

        } catch (err) {
            console.error("Fout bij initialize():", err);
        }
    },

    async checkForUpdates() {
        try {
            console.log("checkForUpdates gestart...");

            const zones = await this.tado.getZones(this.homeId);
            const state = await this.tado.getHomeState(this.homeId);

            const output = [];
            for (const zone of zones) {
                const st = await this.tado.getState(this.homeId, zone.id);

                output.push({
                    name: zone.name,
                    currentTemp: st.sensorDataPoints?.insideTemperature?.celsius ?? null,
                    targetTemp: st.setting?.temperature?.celsius ?? null,
                    heating: (st.activityDataPoints?.heatingPower?.percentage ?? 0) > 0,
                    openWindow: st.openWindowDetected?.length > 0
                });
            }

            const payload = {
                zones: output,
                presence: state.presence
            };

            if (JSON.stringify(payload) !== JSON.stringify(this.previousPayload)) {
                this.previousPayload = payload;
                this.sendSocketNotification("TADO_UPDATE", payload);
                console.log("Data gepushed naar frontend:", payload);
            } else {
                console.log("Geen verandering in data, push overgeslagen");
            }

        } catch (err) {
            console.error("Fout bij checkForUpdates():", err);
        }
    }

});
