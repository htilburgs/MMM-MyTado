const NodeHelper = require("node_helper");
const Tado = require("node-tado-client");
const WebSocket = require("ws");
require("dotenv").config();

module.exports = NodeHelper.create({

    async socketNotificationReceived(notification, payload) {
        if (notification === "TADO_INIT") {
            this.config = payload;
            await this.initialize();
        }
    },

    async initialize() {
        try {
            this.tado = new Tado();
            await this.tado.login(
                process.env.TADO_EMAIL,
                process.env.TADO_PASSWORD
            );

            const homes = await this.tado.getHomes();
            this.homeId = homes[0].id;

            // Start WebSocket server
            this.wss = new WebSocket.Server({ port: 8081 });
            console.log("MMM-MyTado WebSocket gestart op poort 8081");

            this.previousPayload = null;

            // Polling blijft op achtergrond maar stuurt alleen bij wijziging
            setInterval(() => this.checkForUpdates(), 15000);

        } catch (err) {
            console.error("WebSocket init fout:", err);
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
                    currentTemp: st.sensorDataPoints.insideTemperature?.celsius,
                    targetTemp: st.setting?.temperature?.celsius ?? null,
                    heating: (st.activityDataPoints.heatingPower?.percentage ?? 0) > 0,
                    openWindow: st.openWindowDetected?.length > 0
                });
            }

            const payload = {
                zones: output,
                presence: state.presence
            };

            if (JSON.stringify(payload) !== JSON.stringify(this.previousPayload)) {
                this.previousPayload = payload;
                this.broadcast(payload);
            }

        } catch (err) {
            console.error("Realtime update fout:", err);
        }
    },

    broadcast(data) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }

});
