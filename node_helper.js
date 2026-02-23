const NodeHelper = require("node_helper");
const { Tado } = require("node-tado-client"); // v6+ async factory
require("dotenv").config();

module.exports = NodeHelper.create({

    start() {
        console.log("MMM-MyTado node_helper gestart...");
        this.tado = null;
        this.homeId = null;
        this.previousPayload = null;
    },

    async socketNotificationReceived(notification, payload) {
        if (notification === "TADO_INIT") {
            console.log("TADO_INIT ontvangen van frontend!");
            this.config = payload;
            await this.initialize();
        }
    },

    async initialize() {
        console.log("initialize() gestart...");
        try {
            const email = process.env.TADO_EMAIL || this.config.email;
            const password = process.env.TADO_PASSWORD || this.config.password;

            if (!email || !password) {
                console.error("Email of wachtwoord ontbreekt. Controleer .env of config.js");
                return;
            }

            console.log("Probeer in te loggen bij Tado met:", email);

            // ✅ v6+: async factory functie, login automatisch
            this.tado = await Tado({ email, password });
            console.log("Login succesvol!");

            const homes = await this.tado.getHomes();
            if (!homes.length) {
                console.error("Geen Tado homes gevonden!");
                return;
            }

            this.homeId = homes[0].id;
            console.log(`Tado home gevonden: ${homes[0].name} (ID: ${this.homeId})`);

            // Eerste update direct uitvoeren
            await this.checkForUpdates();

            // Polling voor vervoldupdates
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
                    currentTemp: st.sensorDataPoints.insideTemperature?.celsius ?? null,
                    targetTemp: st.setting?.temperature?.celsius ?? null,
                    heating: (st.activityDataPoints.heatingPower?.percentage ?? 0) > 0,
                    openWindow: st.openWindowDetected?.length > 0
                });
            }

            const payload = {
                zones: output,
                presence: state.presence
            };

            // Alleen pushen bij verandering
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
