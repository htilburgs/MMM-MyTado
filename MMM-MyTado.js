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

        this.tadoData.forEach(home => {
            const homeBlock = document.createElement("div");
            homeBlock.className = "tado-home-block";

            // 🔹 Home naam
            if (this.config.showHomeName) {
                const homeTitle = document.createElement("div");
                homeTitle.className = "tado-home";
                homeTitle.innerHTML = home.name;
                homeBlock.appendChild(homeTitle);
            }

            home.zones.forEach(zone => {
                const row = document.createElement("div");
                row.className = "tado-row";

                // waarden ophalen
                const current =
                    zone.state?.sensorDataPoints?.insideTemperature?.celsius;
                const target =
                    zone.state?.setting?.temperature?.celsius;

                const heating =
                    (zone.state?.activityDataPoints?.heatingPower?.percentage ?? 0) > 0;

                const openWindow =
                    Array.isArray(zone.state?.openWindowDetected)
                        ? zone.state.openWindowDetected.length > 0
                        : false;

                const heatingOff =
                    zone.state?.setting?.type === "HEATING_OFF";

                // =====================
                // Kolom 1 — room name (rechts)
                // =====================
                const name = document.createElement("div");
                name.className = "tado-room";
                name.innerHTML = zone.name + ":";
                row.appendChild(name);

                // =====================
                // Kolom 2 — thermometer
                // =====================
                const thermo = document.createElement("div");
                thermo.className = "tado-thermo";
                thermo.innerHTML = this.config.showTemperature ? "T" : "";
                row.appendChild(thermo);

                // =====================
                // Kolom 3 — current temp (links)
                // =====================
                const currentDiv = document.createElement("div");
                currentDiv.className = "tado-current";
                if (this.config.showTemperature) {
                    currentDiv.innerHTML =
                        current !== undefined ? `${current.toFixed(2)} C` : "- C";
                }
                row.appendChild(currentDiv);

                // =====================
                // Kolom 4 — separator (center)
                // =====================
                const sep = document.createElement("div");
                sep.className = "tado-separator";
                sep.innerHTML = this.config.showTemperature ? "/" : "";
                row.appendChild(sep);

                // =====================
                // Kolom 5 — target temp (rechts)
                // =====================
                const targetDiv = document.createElement("div");
                targetDiv.className = "tado-target";
                if (this.config.showTemperature) {
                    targetDiv.innerHTML =
                        target !== undefined ? `${target} C` : "- C";
                }
                row.appendChild(targetDiv);

                // =====================
                // Kolom 6 — status icoon
                // =====================
                const status = document.createElement("div");
                status.className = "tado-status";

                let statusIcon = "S";

                if (this.config.showOpenWindow && openWindow) {
                    statusIcon = "🪟";
                } else if (this.config.showHeating && heating) {
                    statusIcon = "🔥";
                } else if (this.config.showHeating && heatingOff) {
                    statusIcon = "❄";
                }

                status.innerHTML = statusIcon;
                row.appendChild(status);

                homeBlock.appendChild(row);
            });

            wrapper.appendChild(homeBlock);
        });

        // =====================
        // DEBUG RATE LIMIT
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
