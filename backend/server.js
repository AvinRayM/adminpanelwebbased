const express = require("express");
const cors = require("cors");

// Use native fetch (Node 18+ built-in)
const _fetch = typeof fetch !== "undefined" ? fetch : null;

const app = express();

app.use(cors());
app.use(express.json());

// --- SECURE DISCORD WEBHOOK URL ---
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1482931564584239205/hLkTGPF2GrOaLFBIfkZciIzTLbRskhvFNlF0U2Ye8ZSRjAQ0WW7VG2kAylh_YJL2gyHd";

let commands = [];
let blacklistedIPs = [];      
let blacklistedClients = [];  
let blacklistedUsers = [];    
let warnedDevices = {};       

// Helper function to extract real IP from request
function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.ip || req.socket.remoteAddress;
}

// Helper function to check if user is banned
function isBanned(ip, clientId, username) {
    if (blacklistedIPs.includes(ip)) return true;
    if (clientId && blacklistedClients.includes(clientId)) return true;
    if (username && blacklistedUsers.includes(username.toLowerCase())) return true;
    return false;
}

app.post("/command", async (req, res) => {
    const cmd = req.body;
    const ip = getClientIp(req);
    const clientId = cmd.clientId || "Unknown";
    const username = cmd.username || "Unknown";

    if (isBanned(ip, clientId, username)) {
        return res.status(403).json({status: "blacklisted", message: "You are permanently banned."});
    }
    
    if (cmd.type === "execute" && cmd.script && cmd.username) {
        commands.push({ type: cmd.type, script: cmd.script, username: cmd.username });
        res.json({status: "ok", message: "Command queued"});

        if (DISCORD_WEBHOOK && !DISCORD_WEBHOOK.includes("YOUR_DISCORD")) {
            const warnUrl = `https://adminpanelwebbased.onrender.com/mod/warn?clientId=${encodeURIComponent(clientId)}&username=${encodeURIComponent(username)}`;
            const banUrl = `https://adminpanelwebbased.onrender.com/mod/blacklist?ip=${encodeURIComponent(ip)}&clientId=${encodeURIComponent(clientId)}&username=${encodeURIComponent(username)}`;

            const payload = {
                username: "Sync.Fun Moderation",
                avatar_url: "https://i.imgur.com/AfFp7pu.png",
                embeds: [{
                    title: "⚠️ Script Executed",
                    color: 3447003,
                    fields: [
                        { name: "Target Player", value: `\`${username}\``, inline: true },
                        { name: "Device / IP", value: `\`${clientId}\`\n||${ip}||`, inline: true },
                        { name: "Time", value: new Date().toLocaleString(), inline: true }
                    ],
                    description: `**Executed Code:**\n\`\`\`lua\n${cmd.script.substring(0, 1024)}\n\`\`\`\n\n**Moderator Action Links:**\n[⚠️ Warn User](${warnUrl}) | [🔨 Blacklist IP, Device, & Account](${banUrl})`,
                    footer: { text: "Sync.Fun Security System" }
                }]
            };

            try {
                if (_fetch) await _fetch(DISCORD_WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            } catch (err) {
                console.error("Failed to send webhook:", err);
            }
        }
    } else {
        res.status(400).json({status: "error", message: "Missing required fields"});
    }
});

app.get("/commands", (req, res) => {
    res.json(commands);
    commands = []; 
});

app.get("/status", (req, res) => {
    const clientId = req.query.clientId;
    const username = req.query.username;
    const ip = getClientIp(req);
    
    if (isBanned(ip, clientId, username)) return res.json({ status: "blacklisted" });
    if (clientId && warnedDevices[clientId]) {
        const warningMessage = warnedDevices[clientId];
        delete warnedDevices[clientId]; 
        return res.json({ status: "warned", message: warningMessage });
    }
    res.json({ status: "clean" });
});

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

app.get("/mod/blacklist", (req, res) => {
    const ip = req.query.ip;
    const clientId = req.query.clientId;
    const user = req.query.username;
    let bannedSomething = false;

    if (ip && !blacklistedIPs.includes(ip)) { blacklistedIPs.push(ip); bannedSomething = true; }
    if (clientId && !blacklistedClients.includes(clientId)) { blacklistedClients.push(clientId); bannedSomething = true; }
    if (user && !blacklistedUsers.includes(user.toLowerCase())) { blacklistedUsers.push(user.toLowerCase()); bannedSomething = true; }

    if (bannedSomething) {
        res.send(`<h1><span style="color:red">Successfully Blacklisted!</span></h1><p><b>IP Banned:</b> ${ip || 'N/A'}</p><p><b>Roblox Account Banned:</b> ${user || 'N/A'}</p><p>Their connection has been permanently locked out of the executor.</p>`);
    } else {
        res.send(`<h1>Already Blacklisted</h1><p>This user/IP was already in the ban database.</p>`);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
