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

            // Toon home naam
            if (this.config.showHomeName) {
                const homeTitle = document.createElement("div");
                homeTitle.className = "tado-home";
                homeTitle.innerHTML = home.name;
                wrapper.appendChild(homeTitle);
            }

            const table = document.createElement("table");
            table.className = "tado-table";

            // Zones filteren op showZones
            const zonesToShow = this.config.showZones.length > 0
                ? home.zones.filter(z => this.config.showZones.includes(z.name))
                : home.zones;

            zonesToShow.forEach((zone) => {
                const row = document.createElement("tr");

                // 1️⃣ Room name
                const tdName = document.createElement("td");
                tdName.className = "tado-room";
                tdName.innerHTML = `<strong>${zone.name}</strong>`;
                row.appendChild(tdName);

                // 2️⃣ Temperature
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

                let htmlStatus = "";

                // Verwarming / vorstbeveiliging
                if (this.config.showHeating) {
                    const heating = (zone.state.activityDataPoints?.heatingPower?.percentage ?? 0) > 0;
                    htmlStatus += heating ? "🔥 " : "❄ ";
                }

                // Open raam
                if (this.config.showOpenWindow) {
                    const openWindow = Array.isArray(zone.state.openWindowDetected)
                        ? zone.state.openWindowDetected.length > 0
                        : false;
                    if (openWindow) htmlStatus += "🪟";
                }

                tdStatus.innerHTML = htmlStatus;
                row.appendChild(tdStatus);

                table.appendChild(row);
            });

            wrapper.appendChild(table);
        });

        return wrapper;
    }
});
