const loginForm = document.getElementById("login-fform")
// const loginForm = document.querySelector("#login-fform")
// 이제 login-form이 선택된것이다.
const loginInput = document.querySelector("#login-fform input:last-child");
// const loginButton = loginForm.querySelector("button");

const h = document.querySelector("h1");

function onLoginSubmit(event){
    event.preventDefault();
    // console.log(event);
    const userInfo = document.getElementById("a").value;
    loginInput.classList.toggle("hidden");
    h.innerText=`hi ${userInfo}`; //`` vs ''
    h.classList.toggle("hidden");
}

// loginInput.addEventListener("submit", onLoginSubmit);
// loginInput.addEventListener("enter", onLoginSubmit);
loginInput.addEventListener("click", onLoginSubmit);

// 왜 시 발 다 안되는건데?

const link = document.querySelector("a")

function clickLick(event){
    event.preventDefault();
    console.log(event);
}

link.addEventListener("click", clickLick);

// const memo = document.querySelector("h1")

// memo.addEventListener("")