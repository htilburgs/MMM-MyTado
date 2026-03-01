# MMM-MyTado
This a [Magic Mirror²](https://github.com/MichMich/MagicMirror) module for your TADO Thermostat. </br>
The module is based on the idea from WouterEekhout, but his module is not maintained anymore. </br>
I like the idea and built a version with a modern look and feel.

### The module displays the following information:

* The Home name (🏠)
* The Zone names (Configurable names)
* The current temperature and the target temperature
* A symbol (🔥) to show if the heater is currently active.
* The humidity (💦)
* The hot water temperature (🩸)
* Frost Protection (❄️)
* Open Window (🪟)

<img width="402" height="272" alt="SCR-20260226-ukba" src="https://github.com/user-attachments/assets/d3121022-f48e-4c22-9f9b-e2c04a2189d5" />

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
cd ~/MagicMirror/modules/MMM-MyTado
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
	showHomeName: true,					 // Show Home Name as defined within the Tado environment
    showColumnHeaders: true,             // true = show Columns Headers, false = Hide Columns Headers
	useColors: false,					 // Show colors for the Temperature column
	showLastUpdate: true				 // Show last update
    zoneColumnName: "ZONE",				 // Custom Zone Column Name - default = ZONE
    tempColumnName: "TEMP (°C)",		 // Custom Temperature Column Name - default = TEMP (°C)
    humidityColumnName: "",              // empty for no title (default)
    statusColumnName: "STATUS",			 // Custom Status Column Name - default = STATUS
	lastUpdateName: "Last update"		 // Custom Last update name - default = Last update
  }
},
```
## Authentication
The first time you run the module, you will need to authenticate with the Tado API. </br>
No username or password is stored in MMM-MyTado, everything works with OAuth Authentication </br>
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
| `updateInterval`		| **REQUIRED** - The interval the information is updated (in milliseconds)<br /><br />Default: `1800000`</br>This value cannot be lower than `1800000` without a monthly subscription. </br>Otherwise users get a `Tado block`.</br></br>More info at https://help.tado.com/en/articles/12165739-limitation-for-rest-api-usage
| `showZones`			| TADO uses Zones. When you use <code>[]</code> all zones will be shown (default)</br>You can also choose which zones you like to see, just fill in the zones `["Zone 1","Zone 2", etc]`
| `showHomeName`		| Show the Home name as defined in the Tapo environment</br>Default: <b>`true`</b>
| `showColumnHeaders`	| Show the Column Headers</br>Default: <b>`true`</b>
| `useColors`			| Use Colors for the Temperature Column </br>Default: <b>`false`</b>
| `showLastUpdate`		| Show Last Update as a footer<br>DefautL <b>`true`</b>
| `zoneColumnName`		| Custom Zone Column Name - default: <b>`ZONE`</b>
| `tempColumnName` 		| Custom Temperature Column Name - default: <b>`TEMP (°C)`</b>
| `humidityColumnName` 	| Custom Humidity Column Name - default: <b>`Empty`</b> (Column Name is not shown)
| `statusColumnName`   	| Custom Status Column Name - default: <b>`STATUS`</b>
| `lastUpdateName`		| Custom Last update name - default: <b>`Last update`</b>

## Versions
v1.0.0 - Initial release </br>
v1.0.1 - Add Last update option </br>
v1.0.2 - Allignment Home name and Status icons always on the right (CSS)

## Credits
This module is inspired by the [MMM-Tado module from WouterEekhout](https://github.com/WouterEekhout/MMM-Tado) </br>
Using the NPM package [node-tado-client](https://github.com/mattdavis90/node-tado-client)
