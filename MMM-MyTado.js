Module.register("MMM-MyTado", {

    defaults: {
        updateInterval: 1800000,
        showPresence: true,
        showOpenWindow: true
    },

    start() {
        console.log("MMM-MyTado frontend gestart");
        this.dataLoaded = false;
        this.zones = [];
        this.presence = "UNKNOWN";
        this.sendSocketNotification("TADO_INIT", this.config);
    },

    getStyles() {
        return ["MMM-MyTado.css"];
    },

    socketNotificationReceived(notification, payload) {
        if (notification === "TADO_UPDATE") {
            this.zones = payload.zones || [];
            this.presence = payload.presence;
            this.dataLoaded = true;
            this.updateDom(500);
        }
    },

    getDom() {
        const wrapper = document.createElement("div");
        wrapper.className = "tado-wrapper";

        if (!this.dataLoaded) {
            wrapper.innerHTML = "Wachten op realtime data...";
            return wrapper;
        }

        // Presence indicator
        if (this.config.showPresence) {
            const presence = document.createElement("div");
            presence.className = "tado-presence " + this.presence.toLowerCase();
            presence.innerHTML =
                this.presence === "HOME"
                    ? "🟢 Thuis"
                    : "⚪ Afwezig";
            wrapper.appendChild(presence);
        }

        // Zones
        this.zones.forEach(zone => {
            const zoneDiv = document.createElement("div");
            zoneDiv.className = "tado-zone";

            // status class
            if (zone.openWindow && this.config.showOpenWindow) {
                zoneDiv.classList.add("window-open");
            } else if (zone.heating) {
                zoneDiv.classList.add("heating");
            } else {
                zoneDiv.classList.add("idle");
            }

            const title = document.createElement("div");
            title.className = "tado-zone-name";
            title.innerHTML = zone.name;

            const temps = document.createElement("div");
            temps.className = "tado-temps";
            temps.innerHTML =
                `${zone.currentTemp ?? "--"}° → ${zone.targetTemp ?? "--"}°`;

            zoneDiv.appendChild(title);
            zoneDiv.appendChild(temps);

            // open raam waarschuwing
            if (zone.openWindow && this.config.showOpenWindow) {
                const warn = document.createElement("div");
                warn.className = "tado-window-warning";
                warn.innerHTML = "🪟 Raam open";
                zoneDiv.appendChild(warn);
            }

            wrapper.appendChild(zoneDiv);
        });

        return wrapper;
    }
});
