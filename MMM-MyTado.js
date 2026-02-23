Module.register("MMM-MyTado", {

    defaults: {
        updateInterval: 5 * 60 * 1000,
        homes: [],          // [] = eerste home
        zones: [],          // [] = alle zones
        showAway: true,
        showOpenWindow: true,
        colored: true
    },

    start() {
        this.dataLoaded = false;
        this.zonesData = [];
        this.homeState = null;

        this.sendSocketNotification("TADO_INIT", this.config);
    },

    socketNotificationReceived(notification, payload) {
        if (notification === "TADO_UPDATE") {
            this.zonesData = payload.zones;
            this.homeState = payload.homeState;
            this.dataLoaded = true;
            this.updateDom(500);
        }
    },

    getDom() {
        const wrapper = document.createElement("div");

        if (!this.dataLoaded) {
            wrapper.innerHTML = "Tado laden...";
            return wrapper;
        }

        // Home status
        if (this.config.showAway && this.homeState) {
            const homeDiv = document.createElement("div");
            homeDiv.className = "small bright";
            homeDiv.innerHTML =
                this.homeState === "HOME"
                    ? "🏠 Thuis"
                    : "🚗 Afwezig";
            wrapper.appendChild(homeDiv);
        }

        this.zonesData.forEach(zone => {
            const div = document.createElement("div");
            div.className = "tado-zone";

            if (this.config.colored && zone.heating) {
                div.classList.add("heating");
            }

            const openWindow =
                this.config.showOpenWindow && zone.openWindow
                    ? `<span class="open-window">🪟 Open raam</span><br/>`
                    : "";

            div.innerHTML = `
                <div class="zone-name">${zone.name}</div>
                ${openWindow}
                🌡 ${zone.currentTemp}°C<br/>
                🎯 ${zone.targetTemp ?? "Uit"}<br/>
                <span class="heating-icon">${zone.heating ? "🔥" : "❄️"}</span>
            `;

            wrapper.appendChild(div);
        });

        return wrapper;
    }
});
