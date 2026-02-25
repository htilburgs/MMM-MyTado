# MMM-MyTado
This a [Magic Mirror²](https://github.com/MichMich/MagicMirror) for your TADO Thermostat. </br>

<img width="436" height="214" alt="image" src="https://github.com/user-attachments/assets/c4f43789-c3a1-4b78-a822-fe4ba2809c30" />

## Installation
Clone this repository in your modules folder, and install dependencies:
```
cd ~/MagicMirror/modules 
git clone https://github.com/htilburgs/MMM-MyTado.git
cd MMM-MyTado
npm install 
```
## Update
When you need to update this module:
```
cd ~/MagicMirror/modules/MMM-MyTasklist
git pull
npm install
```
## Config
Go to the MagicMirror/config directory and edit the config.js file. </br>
Add the module to your modules array in your config.js.
```
{
  module: "MMM-MyTado",
  position: "top_right",
  header: "TADO Thermostaat",
  disabled: false,
  config: {
    updateInterval: 1800000              // 30 min - because of limitation free account,
    showZones: [],                       // [] = all zones, otherwise use zonename ["zone 1","zone 2"]
    showTemperature: true,
    showHeating: true,
    showOpenWindow: true,
    showColumnHeaders: true,             // true = show Columns, false = hide columns
    zoneColumnName: "ZONE",
    tempColumnName: "TEMP (°C)",
    humidityColumnName: "",              // empty for no title (default)
    statusColumnName: "STATUS"
  }
},
```
## Versions
v1.0.0 - Initial release
