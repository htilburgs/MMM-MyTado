Module.register("MMM-MyTado", {
    defaults: {
        updateInterval: 300000, // 5 min
        showPresence: true,
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

        // Presence
        if (this.config.showPresence) {
            const presence = document.createElement("div");
            presence.innerHTML = `<strong>Presence:</strong> ${this.tadoData.tadoMe.presence || "Unknown"}`;
            wrapper.appendChild(presence);
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

                if (this.config.showTemperature) {
                    const current = zone.state.sensorDataPoints?.insideTemperature?.celsius ?? "-";
                    const target = zone.state.setting?.temperature?.celsius ?? "-";
                    html += `🌡 ${current}°C / ${target}°C `;
                }

                if (this.config.showHeating) {
                    const heating = (zone.state.activityDataPoints?.heatingPower?.percentage ?? 0) > 0;
                    html += heating ? "🔥 " : "❄ ";
                }

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
