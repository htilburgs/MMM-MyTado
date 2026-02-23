Module.register("MMM-MyTado", {

    defaults: {
        updateInterval: 15000, // wordt gebruikt door node_helper
        showAway: true,
        showOpenWindow: true,
        colored: true
    },

    start() {
        this.zones = [];
        this.presence = null;
    },

    socketNotificationReceived(notification, payload) {
        if (notification === "TADO_UPDATE") {
            this.zones = payload.zones;
            this.presence = payload.presence;
            this.updateDom(300);
        }
    },

    getDom() {
        const wrapper = document.createElement("div");

        if (!this.zones.length) {
            wrapper.innerHTML = "Wachten op realtime data...";
            return wrapper;
        }

        const homeDiv = document.createElement("div");
        homeDiv.className = "bright small";
        homeDiv.innerHTML = this.presence === "HOME" ? "🏠 Thuis" : "🚗 Afwezig";
        wrapper.appendChild(homeDiv);

        this.zones.forEach(zone => {
            const div = document.createElement("div");
            div.className = "tado-zone";

            if (this.defaults.colored && zone.heating) div.classList.add("heating");

            div.innerHTML = `
                <b>${zone.name}</b><br/>
                🌡 ${zone.currentTemp?.toFixed(1)}°C<br/>
                🎯 ${zone.targetTemp ?? "Uit"}<br/>
                ${zone.heating ? "🔥 Verwarmen" : "❄️ Idle"}
                ${zone.openWindow ? "<br/>🪟 Open raam" : ""}
                <hr/>
            `;
            wrapper.appendChild(div);
        });

        return wrapper;
    }

});
