const NodeHelper = require("node_helper");
const { Tado } = require("node-tado-client");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
require("dotenv").config();

const ENV_FILE = path.join(__dirname, ".env");
const TOKEN_FILE = path.join(__dirname, "tado_refresh_token.json");

module.exports = NodeHelper.create({
    tadoClient: null,
    refreshToken: null,
    authenticated: false,
    fetching: false,
    config: {},

    async start() {
        console.log("MMM-MyTado: Starting node_helper");

        await this.ensureEnvFile();

        this.tadoClient = new Tado();

        // load refresh token
        if (fs.existsSync(TOKEN_FILE)) {
            try {
                const tokenData = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
                this.refreshToken = tokenData.refresh_token;
                console.log("MMM-MyTado: Refresh token loaded");
            } catch (err) {
                console.error("MMM-MyTado: Failed loading refresh token", err);
            }
        }

        // auto-save tokens
        this.tadoClient.setTokenCallback((token) => {
            if (token?.refresh_token) {
                try {
                    fs.writeFileSync(TOKEN_FILE, JSON.stringify(token), "utf8");
                    this.refreshToken = token.refresh_token;
                    console.log("MMM-MyTado: Refresh token saved");
                } catch (err) {
                    console.error("MMM-MyTado: Failed saving refresh token", err);
                }
            }
        });

        await this.authenticate();
    },

    // 🔹 ENSURE .env EXISTS
    async ensureEnvFile() {
        if (fs.existsSync(ENV_FILE)) {
            console.log("MMM-MyTado: .env found");
            return;
        }

        console.log("MMM-MyTado: .env not found — starting setup");

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const question = (q) => new Promise(res => rl.question(q, res));

        const email = await question("Enter your Tado email: ");
        const password = await question("Enter your Tado password: ");

        rl.close();

        const content =
`TADO_USERNAME=${email.trim()}
TADO_PASSWORD=${password.trim()}
`;

        fs.writeFileSync(ENV_FILE, content, "utf8");
        console.log("MMM-MyTado: .env created");

        // reload dotenv after creating
        require("dotenv").config();
    },

    // 🔹 AUTH
    async authenticate() {
        try {
            const [verify, futureToken] =
                await this.tadoClient.authenticate(this.refreshToken);

            if (verify) {
                console.log("MMM-MyTado: Device auth required:");
                console.log(verify.verification_uri_complete);
            }

            await futureToken;
            this.authenticated = true;
            console.log("MMM-MyTado: Authenticated");
        } catch (err) {
            console.error("MMM-MyTado: Authentication failed", err);
            this.authenticated = false;
        }
    },

    // 🔹 SOCKET
    socketNotificationReceived(notification, payload) {
        if (notification === "CONFIG") {
            this.config = payload;
            this.getData();

            setInterval(() => {
                this.getData();
            }, this.config.updateInterval || 300000);
        }
    },

    // 🔹 DATA FETCH
    async getData() {
        if (!this.authenticated || this.fetching) return;
        this.fetching = true;

        try {
            const me = await this.tadoClient.getMe();

            if (!me?.homes) {
                console.error("MMM-MyTado: No homes in response");
                return;
            }

            this.sendSocketNotification("NEW_DATA", { me });
        } catch (err) {
            console.error("MMM-MyTado: getData error", err);

            // self-healing auth retry
            if (err?.response?.status === 401) {
                console.log("MMM-MyTado: Re-authenticating...");
                this.authenticated = false;
                await this.authenticate();
            }
        } finally {
            this.fetching = false;
        }
    }
});
