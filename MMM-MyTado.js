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

            if (this.config.showHomeName) {
                const homeTitle = document.createElement("div");
                homeTitle.className = "tado-home";
                homeTitle.innerHTML = home.name;
                wrapper.appendChild(homeTitle);
            }

            const table = document.createElement("table");
            table.className = "tado-table";

            home.zones.forEach(zone => {

                // -----------------------
                // Debug log van zone data
                // -----------------------
                if (this.config.debug) {
                    console.log("Zone data:", zone.state);
                }

                const row = document.createElement("tr");

                const current = zone.state.sensorDataPoints?.insideTemperature?.celsius ?? "-";
                const target = zone.state.setting?.temperature?.celsius ?? "-";

                // =====================
                // VEILIGE STATUSCHECK
                // =====================
                let statusIcon = "–"; // fallback
                const openWindowDetected = zone.state.openWindowDetected;
                const heatingPower = zone.state.activityDataPoints?.heatingPower?.percentage ?? 0;
                const settingType = zone.state.setting?.type;

                if (this.config.showOpenWindow &&
                    openWindowDetected &&
                    ((Array.isArray(openWindowDetected) && openWindowDetected.length > 0) ||
                     typeof openWindowDetected === "boolean" && openWindowDetected)) {
                    statusIcon = "🪟";
                } else if (this.config.showHeating && heatingPower > 0) {
                    statusIcon = "🔥";
                } else if (this.config.showHeating && settingType === "HEATING_OFF") {
                    statusIcon = "❄️";
                }

                // 1️⃣ Room name
                const tdName = document.createElement("td");
                tdName.className = "tado-room";
                tdName.innerHTML = zone.name + ":";
                row.appendChild(tdName);

                // 2️⃣ Thermostaat icoon
                const tdThermo = document.createElement("td");
                tdThermo.className = "tado-thermo";
                tdThermo.innerHTML = this.config.showTemperature ? "🌡️" : "";
                row.appendChild(tdThermo);

                // 3️⃣ Current temp
                const tdCurrent = document.createElement("td");
                tdCurrent.className = "tado-current";
                tdCurrent.innerHTML = this.config.showTemperature
                    ? `${current}°C`
                    : "";
                row.appendChild(tdCurrent);

                // 4️⃣ Separator
                const tdSep = document.createElement("td");
                tdSep.className = "tado-separator";
                tdSep.innerHTML = this.config.showTemperature ? "/" : "";
                row.appendChild(tdSep);

                // 5️⃣ Target temp
                const tdTarget = document.createElement("td");
                tdTarget.className = "tado-target";
                tdTarget.innerHTML = this.config.showTemperature
                    ? `${target}°C`
                    : "";
                row.appendChild(tdTarget);

                // 6️⃣ Status icoon
                const tdStatus = document.createElement("td");
                tdStatus.className = "tado-status";
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
