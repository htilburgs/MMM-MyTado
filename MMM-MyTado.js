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

            // Home title
            const homeTitle = document.createElement("div");
            homeTitle.className = "tado-home";
            homeTitle.innerHTML = home.name;
            homeCol.appendChild(homeTitle);

            // Zones
            home.zones.forEach((zone) => {
                const row = document.createElement("div");
                row.className = "tado-zone-row";

                // Kolom 1: Room
                const roomDiv = document.createElement("div");
                roomDiv.className = "tado-col room";
                roomDiv.innerHTML = zone.name;
                row.appendChild(roomDiv);

                // Kolom 2: Temperature
                const tempDiv = document.createElement("div");
                tempDiv.className = "tado-col temp";
                const current = zone.state.sensorDataPoints?.insideTemperature?.celsius ?? "-";
                const target = zone.state.setting?.temperature?.celsius ?? "-";
                tempDiv.innerHTML = `${current}°C / ${target}°C`;
                row.appendChild(tempDiv);

                // Kolom 3: Heating
                const heatingDiv = document.createElement("div");
                heatingDiv.className = "tado-col heating";
                const heating = (zone.state.activityDataPoints?.heatingPower?.percentage ?? 0) > 0;
                heatingDiv.innerHTML = heating ? "🔥" : "❄";
                row.appendChild(heatingDiv);

                // Kolom 4: Open window
                const windowDiv = document.createElement("div");
                windowDiv.className = "tado-col window";
                const openWindow = Array.isArray(zone.state.openWindowDetected)
                    ? zone.state.openWindowDetected.length > 0
                    : false;
                windowDiv.innerHTML = openWindow ? "🪟" : "";
                row.appendChild(windowDiv);

                homeCol.appendChild(row);
            });

            columns.appendChild(homeCol);
        });

        wrapper.appendChild(columns);
        return wrapper;
    }
});
