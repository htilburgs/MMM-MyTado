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
    updateInterval: 1800000                     // 30 min - because of limitation free account,
    showZones: ["Woonkamer", "Slaapkamer"],     // leave empty [] for all zones
    showTemperature: true,
    showHeating: true,
    showOpenWindow: true,
    showColumnHeaders: true,                    // true = show Columns, false = hide columns
    zoneColumnName: "ZONE",
    tempColumnName: "TEMP (°C)",
    humidityColumnName: "", // leeg voor geen titel
    statusColumnName: "STATUS"
  }
},
```
