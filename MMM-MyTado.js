Module.register("MMM-MyTado", {
    defaults: {
        updateInterval: 1800000, // 30 min
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

        if (!this.tadoData) {
            wrapper.innerHTML = "Tado data loading...";
            return wrapper;
        }

        // Homes & Zones
        this.tadoData.tadoHomes.forEach((home) => {
            const homeDiv = document.createElement("div");
            homeDiv.className = "tado-home";
            homeDiv.innerHTML = `<strong>Home:</strong> ${home.name}`;
            wrapper.appendChild(homeDiv);

            home.zones.forEach((zone) => {
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
                homeDiv.appendChild(zoneDiv);
            });
        });

        return wrapper;
    }
});
