# MMM-MyTado
MagicMirror Tado


## Config
```
{
  module: "MMM-MyTado",
  position: "top_right",
  header: "TADO Thermostaat",
  disabled: false,
  config: {
    updateInterval: 1800000   // 30 min,
    zones: ["Woonkamer", "Slaapkamer"],
    showTemperature: true,
    showHeating: true,
    showOpenWindow: true
  }
},
```
