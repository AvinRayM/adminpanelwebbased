const express = require("express")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json())

let commands = []

// website sends command
app.post("/command", (req,res)=>{
    const cmd = req.body
    commands.push(cmd)
    res.json({status:"ok"})
})

// roblox fetches commands
app.get("/commands",(req,res)=>{
    res.json(commands)
    commands = []
})

app.listen(3000, ()=>{
    console.log("Server running")
})