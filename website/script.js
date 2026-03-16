const API = "https://adminpanelwebbased.onrender.com/command"

function kickPlayer(){

const player = document.getElementById("player").value

fetch(API,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
type:"kick",
player:player
})
})

.then(res=>res.json())
.then(data=>{
alert("Kick command sent")
console.log(data)
})

}

function sendPrint(){

const msg = document.getElementById("printmsg").value

fetch(API,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
type:"print",
message:msg
})
})

.then(res=>res.json())
.then(data=>{
alert("Print command sent")
console.log(data)
})

}

function executeScript(){

const code = document.getElementById("scriptEditor").value

fetch(API,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
type:"execute",
script:code
})
})

.then(res=>res.json())
.then(data=>{
alert("Script sent to server")
console.log(data)
})

}
