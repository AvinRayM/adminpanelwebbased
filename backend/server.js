const express = require("express");
const cors = require("cors");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); // For sending webhook in newer Node without breaking older syntax

const app = express();

app.use(cors());
app.use(express.json());

// --- SECURE DISCORD WEBHOOK URL ---
// PASTE YOUR DISCORD WEBHOOK URL HERE:
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1482931564584239205/hLkTGPF2GrOaLFBIfkZciIzTLbRskhvFNlF0U2Ye8ZSRjAQ0WW7VG2kAylh_YJL2gyHd";

let commands = [];
let blacklistedIPs = [];      // Ban by IP
let blacklistedClients = [];  // Ban by Device ID
let blacklistedUsers = [];    // Ban by Roblox Username
let warnedDevices = {};       // Memory to store warnings

// Helper function to extract real IP from request (vital for Render/Proxies)
function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress;
}

// Helper function to check if a user is completely banned
function isBanned(ip, clientId, username) {
    if (blacklistedIPs.includes(ip)) return true;
    if (clientId && blacklistedClients.includes(clientId)) return true;
    if (username && blacklistedUsers.includes(username.toLowerCase())) return true;
    return false;
}

// website sends command with Roblox username and hardware ID
app.post("/command", async (req, res) => {
    const cmd = req.body;
    const ip = getClientIp(req);
    const clientId = cmd.clientId || "Unknown";
    const username = cmd.username || "Unknown";

    // 1. Check if the user is banned (by IP, ID, or Username)
    if (isBanned(ip, clientId, username)) {
        return res.status(403).json({status: "blacklisted", message: "You are permanently banned."});
    }
    
    if (cmd.type === "execute" && cmd.script && cmd.username) {
        // Queue the command for Roblox to fetch
        commands.push({
            type: cmd.type,
            script: cmd.script,
            username: cmd.username
        });

        res.json({status: "ok", message: "Command queued"});

        // Send to Discord Webhook Securely from the server
        if (DISCORD_WEBHOOK && !DISCORD_WEBHOOK.includes("YOUR_DISCORD")) {
            const warnUrl = `https://adminpanelwebbased.onrender.com/mod/warn?clientId=${encodeURIComponent(clientId)}&username=${encodeURIComponent(username)}`;
            // We now pass IP to the ban URL so the server can IP-Ban them
            const banUrl = `https://adminpanelwebbased.onrender.com/mod/blacklist?ip=${encodeURIComponent(ip)}&clientId=${encodeURIComponent(clientId)}&username=${encodeURIComponent(username)}`;

            const payload = {
                username: "Sync.Fun Moderation",
                avatar_url: "https://i.imgur.com/AfFp7pu.png",
                embeds: [{
                    title: "⚠️ Script Executed",
                    color: 3447003, // Blue
                    fields: [
                        { name: "Target Player", value: `\`${username}\``, inline: true },
                        { name: "Device / IP", value: `\`${clientId}\`\n||${ip}||`, inline: true },
                        { name: "Time", value: new Date().toLocaleString(), inline: true }
                    ],
                    description: `**Executed Code:**\n\`\`\`lua\n${cmd.script.substring(0, 1024)}\n\`\`\`\n\n**Moderator Action Links:**\n[⚠️ Warn User](${warnUrl}) | [🔨 Blacklist IP, Device, & Account](${banUrl})`,
                    footer: { text: "Sync.Fun Security System - Rule 1 Monitoring" }
                }]
            };

            try {
                await fetch(DISCORD_WEBHOOK, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                console.error("Failed to send webhook:", err);
            }
        }
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
    const username = req.query.username;
    const ip = getClientIp(req);
    
    // Check IP, ClientID, or Username
    if (isBanned(ip, clientId, username)) {
        return res.json({ status: "blacklisted" });
    }
    
    if (clientId && warnedDevices[clientId]) {
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
        warnedDevices[clientId] = `WARNING: Stop executing malicious scripts on the account ${user}. Continuing to do so will result in a permanent IP and Hardware blacklist.`;
        res.send(`<h1>Successfully Warned ${user}</h1><p>They will see a popup warning on their screen within 15 seconds.</p>`);
    } else {
        res.status(400).send("Missing Client ID");
    }
});

// 3. You click this URL from Discord to BLACKLIST the user's IP, Client ID, and Roblox Username
app.get("/mod/blacklist", (req, res) => {
    const ip = req.query.ip;
    const clientId = req.query.clientId;
    const user = req.query.username;

    let bannedSomething = false;

    if (ip && !blacklistedIPs.includes(ip)) {
        blacklistedIPs.push(ip);
        bannedSomething = true;
    }
    if (clientId && !blacklistedClients.includes(clientId)) {
        blacklistedClients.push(clientId);
        bannedSomething = true;
    }
    if (user && !blacklistedUsers.includes(user.toLowerCase())) {
        blacklistedUsers.push(user.toLowerCase());
        bannedSomething = true;
    }

    if (bannedSomething) {
        res.send(`<h1><span style="color:red">Successfully Blacklisted!</span></h1>
                  <p><b>IP Banned:</b> ${ip || 'N/A'}</p>
                  <p><b>Device Banned:</b> ${clientId || 'N/A'}</p>
                  <p><b>Roblox Account Banned:</b> ${user || 'N/A'}</p>
                  <p>Their connection has been permanently locked out of the executor.</p>`);
    } else {
        res.send(`<h1>Already Blacklisted</h1><p>This user/IP was already in the ban database.</p>`);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
