const clock = document.querySelector(".clock");

function getTime() {
    const time = new Date();
    const hours = String(time.getHours()).padStart(2,"0");
    const minutes = String(time.getMinutes()).padStart(2,"0");
    const seconds = String(time.getSeconds()).padStart(2,"0");
    clock.innerText = `${hours}:${minutes}:${seconds}`;
}

getTime()
setInterval(getTime,1000)