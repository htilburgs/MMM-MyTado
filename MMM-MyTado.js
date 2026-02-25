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

        this.tadoData.tadoHomes.forEach((home) => {
            // Home titel
            if (this.config.showHomeName) {
                const homeTitle = document.createElement("div");
                homeTitle.className = "tado-home";
                homeTitle.textContent = home.name;
                wrapper.appendChild(homeTitle);
            }

            const table = document.createElement("table");
            table.className = "tado-table";

            // Table header
            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");
            headerRow.innerHTML = `<th>Zone</th>
                                   ${this.config.showTemperature ? "<th>Temp (°C)</th>" : ""}
                                   ${this.config.showHeating ? "<th>Heating</th>" : ""}
                                   ${this.config.showOpenWindow ? "<th>Window</th>" : ""}`;
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Filter zones
            const zonesToShow = this.config.showZones.length > 0
                ? home.zones.filter(z => this.config.showZones.includes(z.name))
                : home.zones;

            const tbody = document.createElement("tbody");
            zonesToShow.forEach((zone) => {
                const currentTemp = zone.state.sensorDataPoints?.insideTemperature?.celsius ?? "-";
                const targetTemp = zone.state.setting?.temperature?.celsius ?? "-";
                const heatingOn = (zone.state.activityDataPoints?.heatingPower?.percentage ?? 0) > 0;
                const windowOpen = zone.state.openWindowDetected?.length > 0;

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><strong>${zone.name}</strong></td>
                    ${this.config.showTemperature ? `<td>${currentTemp} / ${targetTemp}</td>` : ""}
                    ${this.config.showHeating ? `<td>${heatingOn ? "🔥" : "💤"}</td>` : ""}
                    ${this.config.showOpenWindow ? `<td>${windowOpen ? "🪟" : ""}</td>` : ""}
                `;
                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            wrapper.appendChild(table);
        });

        return wrapper;
    }
});
