Module.register("MMM-MyTado", {
    defaults: {
        updateInterval: 300000, // 5 min
        showTemperature: true,
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
            if (this.config.showHomeName) {
                const homeTitle = document.createElement("div");
                homeTitle.className = "tado-home";
                homeTitle.textContent = home.name;
                wrapper.appendChild(homeTitle);
            }

            const table = document.createElement("table");
            table.className = "tado-table";

            // Header
            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");
            const zoneHeader = document.createElement("th");
            zoneHeader.textContent = "ZONE".toUpperCase();
            headerRow.appendChild(zoneHeader);

            if (this.config.showTemperature) {
                const tempHeader = document.createElement("th");
                tempHeader.textContent = "TEMP (°C)".toUpperCase();
                headerRow.appendChild(tempHeader);
            }

            const statusHeader = document.createElement("th");
            statusHeader.textContent = "STATUS".toUpperCase();
            headerRow.appendChild(statusHeader);
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

                const heatingPower = zone.state.activityDataPoints?.heatingPower?.percentage ?? 0;
                const frostProtection = zone.state.setting?.power === "OFF" && heatingPower === 0;
                const windowOpen = zone.state.openWindowDetected?.length > 0;

                // Status icons met kleur
                let statusIcons = "";
                if (heatingPower > 0) statusIcons += `<span class="status-heating">🔥</span>`;
                else if (frostProtection) statusIcons += `<span class="status-frost">🧊</span>`;
                if (windowOpen) statusIcons += `<span class="status-window">🪟</span>`;

                // Temperatuur kleur
                let tempColor = "";
                if (typeof currentTemp === "number") {
                    if (currentTemp < 18) tempColor = "temp-cold";
                    else if (currentTemp <= 22) tempColor = "temp-ok";
                    else tempColor = "temp-hot";
                }

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><strong>${zone.name}</strong></td>
                    ${this.config.showTemperature ? `<td class="${tempColor}">${currentTemp} / ${targetTemp}</td>` : ""}
                    <td>${statusIcons}</td>
                `;
                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            wrapper.appendChild(table);
        });

        return wrapper;
    }
});
