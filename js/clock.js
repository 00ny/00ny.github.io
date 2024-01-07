const clock = document.querySelector(".clock");
const img = document.querySelector("img")


function getTime() {
    const time = new Date();
    const hours = String(time.getHours()).padStart(2,"0");
    const minutes = String(time.getMinutes()).padStart(2,"0");
    // const seconds = String(time.getSeconds()).padStart(2,"0");
    clock.innerText = `${hours}:${minutes}`;
    // :${seconds}
}

function opacity() {
    document.querySelector("#dark-mode").style.opacity = 0;
}

function opacity2() {
    document.querySelector("#dark-mode").style.opacity = 0.5;
}

getTime()
setInterval(getTime,1000)

clock.addEventListener("mouseenter",opacity)
clock.addEventListener("mouseleave",opacity2)