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
            // Toon home titel
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

            // Kolomnamen altijd in hoofdletters
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

                // Status icon: 🔥 verwarming, 🧊 vorstbeveiliging, 🪟 open raam
                let statusIcons = "";
                if (heatingPower > 0) {
                    statusIcons += "🔥";
                } else if (frostProtection) {
                    statusIcons += "🧊";
                }
                if (windowOpen) {
                    statusIcons += "🪟";
                }

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><strong>${zone.name}</strong></td>
                    ${this.config.showTemperature ? `<td>${currentTemp} / ${targetTemp}</td>` : ""}
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
