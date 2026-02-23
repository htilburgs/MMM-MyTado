Module.register("MMM-MyTado", {

    defaults: {
        updateInterval: 5 * 60 * 1000, // 5 minuten
        email: "",
        password: "",
        showAwayZones: false
    },

    start: function () {
        this.zones = [];
        this.loaded = false;
        this.sendSocketNotification("TADO_INIT", this.config);
    },

    getStyles: function () {
        return ["MMM-MyTado.css"];
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "TADO_DATA") {
            this.zones = payload;
            this.loaded = true;
            this.updateDom();
        }
    },

    getDom: function () {
        const wrapper = document.createElement("div");

        if (!this.loaded) {
            wrapper.innerHTML = "Tado laden...";
            return wrapper;
        }

        this.zones.forEach(zone => {
            const zoneDiv = document.createElement("div");
            zoneDiv.className = "small";

            zoneDiv.innerHTML = `
                <b>${zone.name}</b><br/>
                🌡 ${zone.currentTemp}°C<br/>
                🎯 ${zone.targetTemp !== null ? zone.targetTemp + "°C" : "Uit"}<br/>
                🔥 ${zone.heating ? "Aan" : "Uit"}
                <hr/>
            `;

            wrapper.appendChild(zoneDiv);
        });

        return wrapper;
    }

});
