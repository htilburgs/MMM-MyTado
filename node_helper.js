const NodeHelper = require("node_helper");
const Tado = require("node-tado-client");
const WebSocket = require("ws");
require("dotenv").config();

module.exports = NodeHelper.create({

    start() {
        console.log("MMM-MyTado node_helper gestart...");
        this.tado = null;
        this.homeId = null;
        this.previousPayload = null;
        this.wss = null;
    },

    async socketNotificationReceived(notification, payload) {
        if (notification === "TADO_INIT") {
            this.config = payload;
            await this.initialize();
        }
    },

    async initialize() {
        try {
            // Login bij Tado
            this.tado = new Tado();
            const email = process.env.TADO_EMAIL || this.config.email;
            const password = process.env.TADO_PASSWORD || this.config.password;

            await this.tado.login(email, password);

            // Eerste home ophalen
            const homes = await this.tado.getHomes();
            if (!homes.length) {
                console.error("Geen Tado homes gevonden!");
                return;
            }
            this.homeId = homes[0].id;
            console.log(`Tado home gevonden: ${homes[0].name} (ID: ${this.homeId})`);

            // WebSocket server starten
            const port = this.config.websocketPort || 8090;
            this.wss = new WebSocket.Server({ port }, () => {
                console.log(`MMM-MyTado WebSocket gestart op poort ${port}`);
            });

            // Log connecties
            this.wss.on("connection", ws => {
                console.log("Nieuwe WebSocket verbinding!");
            });

            // Eerste update meteen uitvoeren
            await this.checkForUpdates();

            // Polling elke 15 seconden voor realtime-gevoel
            setInterval(() => this.checkForUpdates(), 15000);

        } catch (err) {
            console.error("Fout bij initialisatie:", err);
        }
    },

    async checkForUpdates() {
        try {
            // Zones en home state ophalen
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
                this.broadcast(payload);
            }

        } catch (err) {
            console.error("Fout bij realtime update:", err);
        }
    },

    broadcast(data) {
        if (!this.wss) return;
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }

});
