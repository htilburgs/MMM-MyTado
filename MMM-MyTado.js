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

            // Home titel
            if (this.config.showHomeName) {
                const homeTitle = document.createElement("div");
                homeTitle.className = "tado-home";
                homeTitle.innerHTML = home.name;
                wrapper.appendChild(homeTitle);
            }

            const table = document.createElement("table");
            table.className = "tado-table";

            home.zones.forEach(zone => {
                const row = document.createElement("tr");

                // 1️⃣ Zone name
                const tdName = document.createElement("td");
                tdName.className = "tado-room";
                tdName.innerHTML = `<strong>${zone.name}</strong>`;
                row.appendChild(tdName);

                // 2️⃣ Temperatuur
                if (this.config.showTemperature) {
                    const current = zone.state.sensorDataPoints?.insideTemperature?.celsius ?? "-";
                    const target = zone.state.setting?.temperature?.celsius ?? "-";
                    const tdTemp = document.createElement("td");
                    tdTemp.className = "tado-temp";
                    tdTemp.innerHTML = `🌡 ${current}°C / ${target}°C`;
                    row.appendChild(tdTemp);
                }

                // 3️⃣ Status icon
                const tdStatus = document.createElement("td");
                tdStatus.className = "tado-status";

                let statusIcon = "";

                const openWindowDetected = Array.isArray(zone.state.openWindowDetected)
                    ? zone.state.openWindowDetected.length > 0
                    : false;
                const heatingPower = zone.state.activityDataPoints?.heatingPower?.percentage ?? 0;
                const heatingOff = zone.state.setting?.type === "HEATING_OFF";

                if (this.config.showOpenWindow && openWindowDetected) {
                    statusIcon += "🪟";
                } else if (this.config.showHeating && heatingPower > 0) {
                    statusIcon += "🔥";
                } else if (this.config.showHeating && heatingOff) {
                    statusIcon += "❄️";
                }

                tdStatus.innerHTML = statusIcon;
                row.appendChild(tdStatus);

                table.appendChild(row);
            });

            wrapper.appendChild(table);
        });

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
