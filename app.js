const loveme = document.querySelector(".love span");
const love = document.querySelector(".love");

loveme.innerText="love you too"


function handleclick() {
    love.classList.toggle("active")
}

loveme.addEventListener("click", handleclick);
// loveme.onclick = handleclick;