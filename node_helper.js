const NodeHelper = require("node_helper");
const Tado = require("node-tado-client");

module.exports = NodeHelper.create({

    start: function () {
        this.tado = null;
        this.config = null;
    },

    socketNotificationReceived: async function (notification, payload) {
        if (notification === "TADO_INIT") {
            this.config = payload;
            await this.initialize();
        }
    },

    async initialize() {
        try {
            this.tado = new Tado();

            await this.tado.login(this.config.email, this.config.password);

            const me = await this.tado.getMe();
            const homes = await this.tado.getHomes();

            const homeId = homes[0].id;

            this.updateData(homeId);

            setInterval(() => {
                this.updateData(homeId);
            }, this.config.updateInterval);

        } catch (error) {
            console.error("Tado login fout:", error);
        }
    },

    async updateData(homeId) {
        try {
            const zones = await this.tado.getZones(homeId);

            const zoneData = [];

            for (const zone of zones) {
                const state = await this.tado.getState(homeId, zone.id);

                zoneData.push({
                    name: zone.name,
                    currentTemp: state.sensorDataPoints.insideTemperature?.celsius?.toFixed(1),
                    targetTemp: state.setting?.temperature?.celsius ?? null,
                    heating: state.activityDataPoints.heatingPower?.percentage > 0
                });
            }

            this.sendSocketNotification("TADO_DATA", zoneData);

        } catch (error) {
            console.error("Tado update fout:", error);
        }
    }

});
