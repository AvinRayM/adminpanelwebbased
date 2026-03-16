function kickPlayer(){

const player = document.getElementById("player").value

fetch("https://adminpanelwebbased.onrender.com/command",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
type:"kick",
player:player
})
})
.then(res => res.json())
.then(data => {
console.log(data)
alert("Command sent")
})
.catch(err => {
console.error(err)
})
  
}

function sendPrint(){

const msg = document.getElementById("printmsg").value

fetch("https://adminpanelwebbased.onrender.com/command",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
type:"print",
message:msg
})
})
.then(res => res.json())
.then(data => console.log(data))

}
