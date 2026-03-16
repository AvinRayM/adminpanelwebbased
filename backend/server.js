const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

let commands = [];
let blacklistedDevices = []; // Memory to store banned users
let warnedDevices = {};      // Memory to store warnings

// website sends command with Roblox username
app.post("/command", (req, res) => {
    const cmd = req.body;
    
    // We expect { type: 'execute', script: '...', username: 'Ray4Stars' }
    if (cmd.type === "execute" && cmd.script && cmd.username) {
        commands.push({
            type: cmd.type,
            script: cmd.script,
            username: cmd.username
        });
        res.json({status: "ok", message: "Command queued"});
    } else {
        res.status(400).json({status: "error", message: "Missing required fields"});
    }
});

// roblox fetches commands
app.get("/commands", (req, res) => {
    res.json(commands);
    commands = []; // Clear queue to prevent duplicate executions
});

// --- NEW MODERATION SYSTEM ENDPOINTS ---

// 1. Web browser checks this URL constantly to see if they are banned/warned
app.get("/status", (req, res) => {
    const clientId = req.query.clientId;
    
    if (blacklistedDevices.includes(clientId)) {
        return res.json({ status: "blacklisted" });
    }
    
    if (warnedDevices[clientId]) {
        const warningMessage = warnedDevices[clientId];
        delete warnedDevices[clientId]; // Clear warning so it doesn't pop up infinitely
        return res.json({ status: "warned", message: warningMessage });
    }
    
    res.json({ status: "clean" });
});

// 2. You click this URL from Discord to WARN the user
app.get("/mod/warn", (req, res) => {
    const clientId = req.query.clientId;
    const user = req.query.username;
    
    if (clientId) {
        warnedDevices[clientId] = `WARNING: Stop executing malicious scripts on the account ${user}. Continuing to do so will result in a permanent blacklist.`;
        res.send(`<h1>Successfully Warned ${user}</h1><p>They will see a popup warning on their screen within 15 seconds.</p>`);
    } else {
        res.status(400).send("Missing Client ID");
    }
});

// 3. You click this URL from Discord to BLACKLIST the user
app.get("/mod/blacklist", (req, res) => {
    const clientId = req.query.clientId;
    const user = req.query.username;

    if (clientId && !blacklistedDevices.includes(clientId)) {
        blacklistedDevices.push(clientId);
        res.send(`<h1><span style="color:red">Successfully Blacklisted ${user}</span></h1><p>Their device has been locked out of the executor.</p>`);
    } else if (blacklistedDevices.includes(clientId)) {
        res.send(`<h1>Already Blacklisted</h1>`);
    } else {
        res.status(400).send("Missing Client ID");
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
