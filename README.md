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
MMM-MyTado: Device authentication required. Please visit the following URL:
https://login.tado.com/oauth2/device?user_code=XXXXXX
Visit the URL in your browser and follow the instructions to authenticate the module with your Tado account.
```
## Configuration Options
<table width="100%">
	<thead>
		<tr>
			<th>Option</th>
			<th width="100%">Description</th>
		</tr>
	</thead>
	<tbody>
        <tr>
			<td><code>username</code></td>
			<td><b>Required</b> - Your Tado username.</td>
		</tr>
        <tr>
			<td><code>password</code></td>
			<td><b>Required</b> - Your Tado password.</td>
		</tr>
        <tr>
            <td><code>updateInterval</code></td>
            <td><b>Optional</b> - In milliseconds the update interval. Default: <code>300000</code> 
            (5 minutes). This value cannot be lower than <code>300000</code>. Otherwise users get a
             <code>Tado block</code>.</td>
        </tr>
        <tr>
            <td><code>units</code></td>
            <td>
                What units to use. This property can be set in the general configuration settings. See the <a href="https://docs.magicmirror.builders/getting-started/configuration.html#general">MagicMirror Documentation</a> for more information.
            </td>
        </tr>
	</tbody>
</table>

## Versions
v1.0.0 - Initial release
