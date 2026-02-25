Module.register("MMM-MyTado", {
    defaults: {
        updateInterval: 300000,
        showTemperature: true,
        showZones: [],
        showHomeName: true
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

    getCurrentTemperature: function(zone) {
        // Alleen voor radiatoren / kamers
        if (zone.state.sensorDataPoints?.insideTemperature?.celsius != null) {
            return parseFloat(zone.state.sensorDataPoints.insideTemperature.celsius);
        }
        return NaN; // Warm water gebruikt target als placeholder
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

            // Table header
            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");

            const zoneHeader = document.createElement("th");
            zoneHeader.textContent = "ZONE".toUpperCase();
            headerRow.appendChild(zoneHeader);

            if (this.config.showTemperature) {
                const tempHeader = document.createElement("th");
                tempHeader.textContent = "TEMP (°C)".toUpperCase();
                headerRow.appendChild(tempHeader);

                // Extra kolom voor vochtigheid, zonder titel
                const humidityHeader = document.createElement("th");
                humidityHeader.textContent = "";
                headerRow.appendChild(humidityHeader);
            }

            const statusHeader = document.createElement("th");
            statusHeader.textContent = "STATUS".toUpperCase();
            headerRow.appendChild(statusHeader);

            thead.appendChild(headerRow);
            table.appendChild(thead);

            const zonesToShow = this.config.showZones.length > 0
                ? home.zones.filter(z => this.config.showZones.includes(z.name))
                : home.zones;

            const tbody = document.createElement("tbody");
            zonesToShow.forEach((zone) => {
                const heatingPower = zone.state.activityDataPoints?.heatingPower?.percentage ?? 0;
                const frostProtection = zone.state.setting?.power === "OFF" && heatingPower === 0;
                const windowOpen = zone.state.openWindowDetected?.length > 0;

                const isHotWaterZone = zone.type?.toLowerCase().includes("hotwater") || zone.name.toLowerCase().includes("warm water");

                const currentTempNum = this.getCurrentTemperature(zone);
                const targetTempNum = parseFloat(zone.state.setting?.temperature?.celsius);

                // Temperatuur display
                let tempDisplay = "-";
                let tempColor = "";

                if (isHotWaterZone && !isNaN(targetTempNum)) {
                    tempDisplay = targetTempNum.toFixed(1);
                    if (targetTempNum < 18) tempColor = "temp-cold";
                    else if (targetTempNum <= 22) tempColor = "temp-ok";
                    else tempColor = "temp-hot";
                } else if (!isNaN(currentTempNum)) {
                    const currentTempStr = currentTempNum.toFixed(1);
                    const targetTempStr = frostProtection ? "OFF" : (!isNaN(targetTempNum) ? targetTempNum.toFixed(1) : "-");
                    tempDisplay = `${currentTempStr} / ${targetTempStr}`;
                    if (currentTempNum < 18) tempColor = "temp-cold";
                    else if (currentTempNum <= 22) tempColor = "temp-ok";
                    else tempColor = "temp-hot";
                }

                // Vochtigheid
                let humidityDisplay = "-";
                const humidityNum = zone.state.sensorDataPoints?.humidity?.percentage;
                if (!isNaN(humidityNum)) {
                    humidityDisplay = `💦 ${humidityNum.toFixed(0)}%`;
                }

                // Status iconen
                let statusIcons = "";
                if (heatingPower > 0) statusIcons += `<span class="status-heating">🔥</span>`;
                else if (frostProtection) statusIcons += `<span class="status-frost">❄️</span>`;
                if (windowOpen) statusIcons += `<span class="status-window">🪟</span>`;
                if (isHotWaterZone) statusIcons += `<span class="status-hotwater" title="Warm water">💧</span>`;

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><strong>${zone.name}</strong></td>
                    ${this.config.showTemperature ? `<td class="${tempColor}">${tempDisplay}</td><td>${humidityDisplay}</td>` : ""}
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
