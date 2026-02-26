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
	updateInterval: 1800000,             // 30 min - because of limitation free account
    showZones: [],                       // [] = all zones, otherwise use zonename ["zone 1","zone 2"]
    showTemperature: true,
    showHeating: true,
    showOpenWindow: true,
	showHomeName: true,
    showColumnHeaders: true,             // true = show Columns, false = hide columns
    zoneColumnName: "ZONE",
    tempColumnName: "TEMP (°C)",
    humidityColumnName: "",              // empty for no title (default)
    statusColumnName: "STATUS"
  }
},
```
## Authentication
The first time you run the module, you will need to authenticate with the Tado API. </br>
The module will log a URL that you need to visit in your browser to complete the authentication process. </br>
Check the logs for a message like this:
```
MMM-MyTado: Device authentication required. 
Open this URL to authenticate:
https://login.tado.com/oauth2/device?user_code=XXXXXX
```
Visit the URL in your browser and follow the instructions to authenticate the module with your Tado account.

<img width="250" height="200" alt="image" src="https://github.com/user-attachments/assets/3a3b2b01-909b-4eaf-a8e5-c356e2b66289" /><img width="250" height="200" alt="image" src="https://github.com/user-attachments/assets/2f450205-6a15-4435-8392-6040dcbeb0c4" /><img width="250" height="200" alt="image" src="https://github.com/user-attachments/assets/f6a17c2c-6cfe-4a4a-8bfb-09f56d0a05ba" />


## Configuration Options
| Option                | Description
|:----------------------|:-------------
| `updateInterval`		| **REQUIRED** - The interval the information is updated (in milliseconds)<br /><br />Default: `1800000`</br>This value cannot be lower than <code>1800000</code> without a monthly subscription. </br>Otherwise users get a <code>Tado block</code>.</br>More info at https://help.tado.com/en/articles/12165739-limitation-for-rest-api-usage
| `showZones`			| TADO uses Zones. When you use <code>[]</code> all zones will be shown (default)</br>You can also choose which zones you like to see, just fill in the zones <code>["Zone 1","Zone 2", etc]</code>
| `showTemperature`		| 
| `showHeating`			| 
| `showOpenWindow`		| 
| `showColumnHeaders`	| 
| `zoneColumnName`		| 
| `tempColumnName` 		| 
| `humidityColumnName` 	| 
| `statusColumnName`   	| 

## Versions
v1.0.0 - Initial release
