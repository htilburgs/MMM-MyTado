Module.register("MMM-MyTado", {
    defaults: {
        updateInterval: 1800000,          // 30 minutes
        showZones: [],                    // [] = all zones
        showHomeName: true,               // Show home name
        showColumnHeaders: true,          // Show column headers
        useColors: true,                  // true = temperature colors on, false = off
        showLastUpdate: true,             // Show last update footer
        zoneColumnName: "ZONE",
        tempColumnName: "TEMP (°C)",
        humidityColumnName: "",           // empty string = no title
        statusColumnName: "STATUS",
        lastUpdateName: "Last update"     // <-- customizable label
    },

    getStyles: function () {
        return ["MMM-MyTado.css"];
    },

    start: function () {
        this.tadoData = null;
        this.sendSocketNotification("CONFIG", this.config); // send config to Node helper
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

            if (this.config.showColumnHeaders) {
                const thead = document.createElement("thead");
                const headerRow = document.createElement("tr");

                const zoneHeader = document.createElement("th");
                zoneHeader.textContent = this.config.zoneColumnName.toUpperCase();
                headerRow.appendChild(zoneHeader);

                const tempHeader = document.createElement("th");
                tempHeader.textContent = this.config.tempColumnName.toUpperCase();
                headerRow.appendChild(tempHeader);

                const humidityHeader = document.createElement("th");
                humidityHeader.textContent = this.config.humidityColumnName;
                headerRow.appendChild(humidityHeader);

                const statusHeader = document.createElement("th");
                statusHeader.textContent = this.config.statusColumnName.toUpperCase();
                headerRow.appendChild(statusHeader);

                thead.appendChild(headerRow);
                table.appendChild(thead);
            }

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

                let humidityDisplay = "";
                if (!isHotWaterZone) {
                    const humidityNum = zone.state.sensorDataPoints?.humidity?.percentage;
                    if (!isNaN(humidityNum)) humidityDisplay = `💦 ${humidityNum.toFixed(0)}%`;
                    else humidityDisplay = "-";
                }

                let statusIcons = "";
                if (heatingPower > 0) statusIcons += `<span class="status-icon" title="Heating">🔥</span>`;
                else if (frostProtection) statusIcons += `<span class="status-icon" title="Frost Protection">❄️</span>`;
                if (windowOpen) statusIcons += `<span class="status-icon" title="Open Window">🪟</span>`;
                if (isHotWaterZone) statusIcons += `<span class="status-icon" title="Hot Water">🩸</span>`;

                const row = document.createElement("tr");
                const tempCell = `<td class="${this.config.useColors ? tempColor : ""}">${tempDisplay}</td>`;
                const humidityCell = `<td style="text-align: right;">${humidityDisplay}</td>`;

                row.innerHTML = `
                    <td class="tado-zone">${zone.name}</td>
                    ${tempCell}
                    ${humidityCell}
                    <td>${statusIcons}</td>
                `;
                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            wrapper.appendChild(table);
        });

        // Footer: last update
        if (this.config.showLastUpdate && this.tadoData?.lastUpdate) {
            const lastUpdateDiv = document.createElement("div");
            lastUpdateDiv.className = "last-update";

            const date = new Date(this.tadoData.lastUpdate);
            const hours = date.getHours().toString().padStart(2, "0");
            const minutes = date.getMinutes().toString().padStart(2, "0");

            lastUpdateDiv.textContent = `${this.config.lastUpdateName}: ${hours}:${minutes}`;
            wrapper.appendChild(lastUpdateDiv);
        }

        return wrapper;
    }
});
