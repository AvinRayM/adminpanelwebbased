const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

let commands = [];

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
    commands = []; // Prevents duplicate executions
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
