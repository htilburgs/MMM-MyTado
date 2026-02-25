Module.register("MMM-MyTado", {
    defaults: {
        updateInterval: 300000, // 5 min
        showTemperature: true,
        showHeating: true,
        showOpenWindow: true,
        showZones: [], // lege array = alle zones
        showHomeName: true // toon home naam
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

            // Toon home naam
            if (this.config.showHomeName) {
                const homeTitle = document.createElement("div");
                homeTitle.className = "tado-home";
                homeTitle.textContent = home.name;
                homeCol.appendChild(homeTitle);
            }

            // Filter zones
            const zonesToShow = this.config.showZones.length > 0
                ? home.zones.filter(z => this.config.showZones.includes(z.name))
                : home.zones;

            zonesToShow.forEach((zone) => {
                const zoneDiv = document.createElement("div");
                zoneDiv.className = "tado-zone";

                const currentTemp = zone.state.sensorDataPoints?.insideTemperature?.celsius ?? "-";
                const targetTemp = zone.state.setting?.temperature?.celsius ?? "-";
                const heatingOn = (zone.state.activityDataPoints?.heatingPower?.percentage ?? 0) > 0;
                const windowOpen = zone.state.openWindowDetected?.length > 0;

                zoneDiv.innerHTML = `
                    <strong>${zone.name}</strong>:
                    ${this.config.showTemperature ? `🌡 ${currentTemp}°C / ${targetTemp}°C ` : ""}
                    ${this.config.showHeating ? (heatingOn ? "🔥" : "💤") : ""}
                    ${this.config.showOpenWindow && windowOpen ? "🪟" : ""}
                `;
                homeCol.appendChild(zoneDiv);
            });

            columns.appendChild(homeCol);
        });

        wrapper.appendChild(columns);
        return wrapper;
    }
});
