Module.register("MMM-MyTado", {

    defaults: {
        websocketPort: 8081
    },

    start() {
        this.zones = [];
        this.presence = null;
        this.connectWebSocket();
    },

    connectWebSocket() {
        const ws = new WebSocket(`ws://localhost:${this.config.websocketPort}`);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.zones = data.zones;
            this.presence = data.presence;
            this.updateDom(300);
        };

        ws.onclose = () => {
            console.log("WebSocket herverbinden...");
            setTimeout(() => this.connectWebSocket(), 5000);
        };
    },

    getDom() {
        const wrapper = document.createElement("div");

        if (!this.zones.length) {
            wrapper.innerHTML = "Wachten op realtime data...";
            return wrapper;
        }

        const home = document.createElement("div");
        home.className = "bright small";
        home.innerHTML =
            this.presence === "HOME" ? "🏠 Thuis" : "🚗 Afwezig";
        wrapper.appendChild(home);

        this.zones.forEach(zone => {
            const div = document.createElement("div");
            div.className = "tado-zone";

            if (zone.heating) div.classList.add("heating");

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
