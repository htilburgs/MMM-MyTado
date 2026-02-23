const NodeHelper = require("node_helper");
const Tado = require("node-tado-client");
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
            this.config = payload;
            await this.initialize();
        }
    },

    async initialize() {
        try {
            this.tado = new Tado();
            const email = process.env.TADO_EMAIL || this.config.email;
            const password = process.env.TADO_PASSWORD || this.config.password;

            await this.tado.login(email, password);

            const homes = await this.tado.getHomes();
            if (!homes.length) {
                console.error("Geen Tado homes gevonden!");
                return;
            }
            this.homeId = homes[0].id;
            console.log(`Tado home gevonden: ${homes[0].name} (ID: ${this.homeId})`);

            // Eerste update meteen
            await this.checkForUpdates();

            // Polling elke 15s voor realtime updates
            setInterval(() => this.checkForUpdates(), 15000);

        } catch (err) {
            console.error("Fout bij initialisatie:", err);
        }
    },

    async checkForUpdates() {
        try {
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

            // Alleen pushen als er verandering is
            if (JSON.stringify(payload) !== JSON.stringify(this.previousPayload)) {
                this.previousPayload = payload;
                this.sendSocketNotification("TADO_UPDATE", payload);
            }

        } catch (err) {
            console.error("Fout bij update:", err);
        }
    }

});
