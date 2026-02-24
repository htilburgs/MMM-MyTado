Module.register("MMM-MyTado", {
    defaults: {
        updateInterval: 300000, // 5 min
        showTemperature: true,
        showHeating: true,
        showOpenWindow: true
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

            const homeTitle = document.createElement("div");
            homeTitle.className = "tado-home";
            homeTitle.innerHTML = home.name;
            homeCol.appendChild(homeTitle);

            // Table-like structure for zones
            const zoneTable = document.createElement("div");
            zoneTable.className = "tado-zone-table";

            home.zones.forEach((zone) => {
                const row = document.createElement("div");
                row.className = "tado-zone-row";

                // Room name
                const roomDiv = document.createElement("div");
                roomDiv.className = "tado-zone-room";
                roomDiv.innerHTML = zone.name;
                row.appendChild(roomDiv);

                // Temperature
                if (this.config.showTemperature) {
                    const tempDiv = document.createElement("div");
                    tempDiv.className = "tado-zone-temp";
                    const current = zone.state.sensorDataPoints?.insideTemperature?.celsius ?? "-";
                    const target = zone.state.setting?.temperature?.celsius ?? "-";
                    tempDiv.innerHTML = `${current}°C / ${target}°C`;
                    row.appendChild(tempDiv);
                }

                // Heating
                if (this.config.showHeating) {
                    const heatingDiv = document.createElement("div");
                    heatingDiv.className = "tado-zone-heating";
                    const heating = (zone.state.activityDataPoints?.heatingPower?.percentage ?? 0) > 0;
                    heatingDiv.innerHTML = heating ? "🔥" : "❄";
                    row.appendChild(heatingDiv);
                }

                // Open window
                if (this.config.showOpenWindow) {
                    const windowDiv = document.createElement("div");
                    windowDiv.className = "tado-zone-window";
                    const openWindow = Array.isArray(zone.state.openWindowDetected)
                        ? zone.state.openWindowDetected.length > 0
                        : false;
                    windowDiv.innerHTML = openWindow ? "🪟" : "";
                    row.appendChild(windowDiv);
                }

                zoneTable.appendChild(row);
            });

            homeCol.appendChild(zoneTable);
            columns.appendChild(homeCol);
        });

        wrapper.appendChild(columns);
        return wrapper;
    }
});
