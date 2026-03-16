const express = require("express")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json())

let commands = []

// website sends command
app.post("/command", (req,res)=>{
    const cmd = req.body
    
    // Ensure we have the required fields
    if (cmd.type === "execute" && cmd.script && cmd.username) {
        commands.push({
            type: cmd.type,
            script: cmd.script,
            username: cmd.username,
            timestamp: Date.now()
        })
        res.json({status:"ok", message: "Command queued"})
    } else {
        res.status(400).json({status: "error", message: "Missing required fields (script or username)"})
    }
})

// roblox fetches commands
app.get("/commands",(req,res)=>{
    res.json(commands)
    // Clear commands after they are fetched so they don't execute multiple times
    commands = []
})

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`)
})
