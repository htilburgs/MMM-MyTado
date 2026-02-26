Module.register("MMM-MyTado", {
    defaults: {
        updateInterval: 1800000,          // 30 minutes (free Tado API)
        showZones: [],                    // [] = all zones, otherwise ["zone 1","zone 2"]
        showHomeName: true,               // Show home name
        showColumnHeaders: true,          // Show column headers
        useColors: true,                   // true = temperature colors on, false = off
        
        zoneColumnName: "ZONE",
        tempColumnName: "TEMP (°C)",
        humidityColumnName: "",           // empty string = no title
        statusColumnName: "STATUS",
    },

    getStyles: function () {
        return ["MMM-MyTado.css"];
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
        if (zone.state.sensorDataPoints?.insideTemperature?.celsius != null) {
            return parseFloat(zone.state.sensorDataPoints.insideTemperature.celsius);
        }
        return NaN;
    },

    getDom: function () {
        const wrapper = document.createElement("div");
        wrapper.className = "tado-wrapper";

        if (!this.tadoData) {
            wrapper.innerHTML = "Loading Tado data...";
            return wrapper;
        }

        this.tadoData.tadoHomes.forEach((home) => {
            if (this.config.showHomeName) {
                const homeTitle = document.createElement("div");
                homeTitle.className = "tado-home";
                homeTitle.textContent = `🏠 ${home.name}`;
                wrapper.appendChild(homeTitle);
            }

            const table = document.createElement("table");
            table.className = "tado-table";

            // Column headers
            if (this.config.showColumnHeaders) {
                const thead = document.createElement("thead");
                const headerRow = document.createElement("tr");

                const zoneHeader = document.createElement("th");
                zoneHeader.textContent = this.config.zoneColumnName.toUpperCase();
                headerRow.appendChild(zoneHeader);

                const tempHeader = document.createElement("th");
                tempHeader.textContent = this.config.tempColumnName.toUpperCase();
                headerRow.appendChild(tempHeader);

                // Empty spacer column
                const spacerHeader = document.createElement("th");
                spacerHeader.textContent = "";
                headerRow.appendChild(spacerHeader);

                const humidityHeader = document.createElement("th");
                humidityHeader.textContent = this.config.humidityColumnName;
                headerRow.appendChild(humidityHeader);

                const statusHeader = document.createElement("th");
                statusHeader.textContent = this.config.statusColumnName.toUpperCase();
                headerRow.appendChild(statusHeader);

                thead.appendChild(headerRow);
                table.appendChild(thead);
            }

            // Filter zones to show
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

                // Temperature display
                let tempDisplay = "-";
                let tempColor = "";

                if (isHotWaterZone && !isNaN(targetTempNum)) {
                    tempDisplay = targetTempNum.toFixed(1) + "°";
                    if (targetTempNum < 18) tempColor = "temp-cold";
                    else if (targetTempNum <= 22) tempColor = "temp-ok";
                    else tempColor = "temp-hot";
                } else if (!isNaN(currentTempNum)) {
                    const currentTempStr = currentTempNum.toFixed(1);
                    const targetTempStr = frostProtection ? "OFF" : (!isNaN(targetTempNum) ? targetTempNum.toFixed(1) : "-");
                    tempDisplay = `${currentTempStr}° / ${targetTempStr === "OFF" ? "OFF" : targetTempStr + "°"}`;

                    if (currentTempNum < 18) tempColor = "temp-cold";
                    else if (currentTempNum <= 22) tempColor = "temp-ok";
                    else tempColor = "temp-hot";
                }

                // Humidity display
                let humidityDisplay = "";
                if (!isHotWaterZone) {
                    const humidityNum = zone.state.sensorDataPoints?.humidity?.percentage;
                    if (!isNaN(humidityNum)) humidityDisplay = `💦 ${humidityNum.toFixed(0)}%`;
                    else humidityDisplay = "-";
                }

                // Status icons
                let statusIcons = "";
                if (heatingPower > 0) statusIcons += `<span class="status-heating" title="Heating">🔥</span>`;
                else if (frostProtection) statusIcons += `<span class="status-frost" title="Frost Protection">❄️</span>`;
                if (windowOpen) statusIcons += `<span class="status-window" title="Open Window">🪟</span>`;
                if (isHotWaterZone) statusIcons += `<span class="status-hotwater" title="Hot Water">🩸</span>`;

                // Create table row with empty spacer column
                const row = document.createElement("tr");
                const tempCell = `<td class="${this.config.useColors ? tempColor : ""}">${tempDisplay}</td>`;
                const spacerCell = `<td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>`;
                const humidityCell = `<td style="text-align: right;">${humidityDisplay}</td>`;

                row.innerHTML = `
                    <td class="tado-zone">${zone.name}</td>
                    ${tempCell}
                    ${spacerCell}
                    ${humidityCell}
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
