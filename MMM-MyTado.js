Module.register("MMM-MyTado", {
    defaults: {
        updateInterval: 300000, // 5 min
        showTemperature: true,
        showHeating: true,
        showOpenWindow: true,
        showZones: [] // lege array = alle zones, anders array met zonenamen
    },

    start: function () {
        this.tadoData = null;
        this.sendSocketNotification("CONFIG", this.config);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "NEW_DATA") {
            this.tadoData = payload;
            this.updateDom();
        }
    },

    getDom: function () {
        const wrapper = document.createElement("div");
        wrapper.className = "tado-wrapper";

        if (!this.tadoData) {
            wrapper.innerHTML = "Tado data loading...";
            return wrapper;
        }

        const columns = document.createElement("div");
        columns.className = "tado-columns";

        this.tadoData.tadoHomes.forEach((home) => {
            const homeCol = document.createElement("div");
            homeCol.className = "tado-column";

            // Home title
            const homeTitle = document.createElement("div");
            homeTitle.className = "tado-home";
            homeTitle.innerHTML = home.name;
            homeCol.appendChild(homeTitle);

            // Zones filteren op showZones
            const zonesToShow = this.config.showZones.length > 0
                ? home.zones.filter(z => this.config.showZones.includes(z.name))
                : home.zones;

            zonesToShow.forEach((zone) => {
                const zoneDiv = document.createElement("div");
                zoneDiv.className = "tado-zone";
                let html = `<strong>${zone.name}</strong>: `;

                // Temperature
                if (this.config.showTemperature) {
                    const current = zone.state.sensorDataPoints?.insideTemperature?.celsius ?? "-";
                    const target = zone.state.setting?.temperature?.celsius ?? "-";
                    html += `🌡 ${current}°C / ${target}°C `;
                }

                // Heating
                if (this.config.showHeating) {
                    const heating = (zone.state.activityDataPoints?.heatingPower?.percentage ?? 0) > 0;
                    html += heating ? "🔥 " : "❄ ";
                }

                // Open window
                if (this.config.showOpenWindow) {
                    const openWindow = Array.isArray(zone.state.openWindowDetected)
                        ? zone.state.openWindowDetected.length > 0
                        : false;
                    if (openWindow) html += "🪟";
                }

                zoneDiv.innerHTML = html;
                homeCol.appendChild(zoneDiv);
            });

            columns.appendChild(homeCol);
        });

        wrapper.appendChild(columns);
        return wrapper;
    }
});
