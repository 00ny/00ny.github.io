// const title = document.getElementById("title");

// title.innerText = "Got you";

const loveme = document.querySelector("#love span");

loveme.innerText="love you too"

function handleclick() {
    console.log("span is clicked!");
    loveme.style.color="tomato";
}

// loveme.addEventListener("click", handleclick);
loveme.onclick = handleclick;

function handleWindowResize() {
    document.body.style.backgroundColor = "yellow"
}

window.addEventListener("resize",handleWindowResize);

function copyevent() {
    alert("do not copy!");
}

window.addEventListener("copy",copyevent)

function on_butoff() {
    alert("SOS no wifi")
}

function off_buton() {
    alert("all good")
}

window.addEventListener("offline",on_butoff)
window.addEventListener("onine",off_buton)