const NodeHelper = require("node_helper");
const Tado = require("node-tado-client");
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

            const email = process.env.TADO_EMAIL || this.config.email;
            const password = process.env.TADO_PASSWORD || this.config.password;

            await this.tado.login(email, password);

            const homes = await this.tado.getHomes();

            this.homeIds =
                this.config.homes.length > 0
                    ? this.config.homes
                    : [homes[0].id];

            await this.updateLoop();

            setInterval(
                () => this.updateLoop(),
                this.config.updateInterval
            );

        } catch (err) {
            console.error("MMM-MyTado init fout:", err);
        }
    },

    async updateLoop() {
        try {
            const zonesOut = [];
            let homePresence = null;

            for (const homeId of this.homeIds) {
                const state = await this.tado.getHomeState(homeId);
                homePresence = state.presence;

                const zones = await this.tado.getZones(homeId);

                for (const zone of zones) {

                    if (
                        this.config.zones.length &&
                        !this.config.zones.includes(zone.name)
                    ) continue;

                    const st = await this.tado.getState(homeId, zone.id);

                    zonesOut.push({
                        name: zone.name,
                        currentTemp:
                            st.sensorDataPoints.insideTemperature?.celsius?.toFixed(1),
                        targetTemp:
                            st.setting?.temperature?.celsius ?? null,
                        heating:
                            (st.activityDataPoints.heatingPower?.percentage ?? 0) > 0,
                        openWindow:
                            st.openWindowDetected?.length > 0
                    });
                }
            }

            this.sendSocketNotification("TADO_UPDATE", {
                zones: zonesOut,
                homeState: homePresence
            });

        } catch (err) {
            console.error("MMM-MyTado update fout:", err);
        }
    }

});
