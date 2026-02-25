Module.register("MMM-MyTado", {
    defaults: {
        updateInterval: 300000,
        showTemperature: true,
        showHeating: true,
        showOpenWindow: true,
        showZones: [],
        showHomeName: true,
        debug: false
    },

    start: function () {
        this.tadoData = null;
        this.apiRateLimit = null;
        this.sendSocketNotification("CONFIG", this.config);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "NEW_DATA") {
            this.tadoData = payload.tadoHomes;
            this.apiRateLimit = payload.apiRateLimit || null;
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

        this.tadoData.forEach(home => {
            const homeCol = document.createElement("div");
            homeCol.className = "tado-column";

            if (this.config.showHomeName) {
                const homeTitle = document.createElement("div");
                homeTitle.className = "tado-home";
                homeTitle.innerHTML = home.name;
                homeCol.appendChild(homeTitle);
            }

            home.zones.forEach(zone => {
                const zoneDiv = document.createElement("div");
                zoneDiv.className = "tado-zone";

                let html = `<strong>${zone.name}</strong>: `;

                if (this.config.showTemperature) {
                    const current =
                        zone.state.sensorDataPoints?.insideTemperature?.celsius ?? "-";
                    const target =
                        zone.state.setting?.temperature?.celsius ?? "-";

                    html += `🌡 ${current}°C / ${target}°C `;
                }

                if (this.config.showHeating) {
                    const heating =
                        (zone.state.activityDataPoints?.heatingPower?.percentage ?? 0) > 0;
                    html += heating ? "🔥 " : "❄ ";
                }

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

        // =====================
        // DEBUG RATE-LIMIT
        // =====================
        if (this.config.debug && this.apiRateLimit) {
            const dbg = document.createElement("div");
            dbg.className = "tado-debug";

            let resetText = this.apiRateLimit.reset;
            if (resetText && !isNaN(resetText)) {
                const d = new Date(resetText * 1000);
                resetText = d.toLocaleTimeString();
            }

            dbg.innerHTML = `
                <hr>
                API limit: ${this.apiRateLimit.limit ?? "unknown"}<br>
                Remaining: ${this.apiRateLimit.remaining ?? "unknown"}<br>
                Reset: ${resetText ?? "unknown"}
            `;

            const remaining = Number(this.apiRateLimit.remaining);
            if (!isNaN(remaining)) {
                if (remaining < 10) dbg.style.color = "red";
                else if (remaining < 25) dbg.style.color = "orange";
            }

            wrapper.appendChild(dbg);
        }

        return wrapper;
    }
});
