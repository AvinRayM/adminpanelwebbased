async function kickPlayer(){

const player = document.getElementById("player").value

await fetch("https://YOUR-RENDER-URL/command",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
type:"kick",
player:player
})
})

alert("Command sent")

}