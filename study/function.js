function say(name,age) {
    console.log("Hello my name is "+name+" and I'm "+age)
}

say("woon",24)

function calc(a,b) {
    console.log(a+b)
    console.log(a-b)
    console.log(a*b)
    console.log(a/b)
}

calc(3,4)

const playver = {
    name:"nico",
    sayHello: function () {
        console.log("helo!");
    },
};

console.log(playver.name)
playver.sayHello()

//############

const loveme = document.querySelector(".love span");
const love = document.querySelector(".love");

loveme.innerText="love you too"


function handleclick() {
    love.classList.toggle("active")
}

loveme.addEventListener("click", handleclick);
// loveme.onclick = handleclick;