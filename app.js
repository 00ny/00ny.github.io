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
    loginForm.classList.toggle("hidden");
    localStorage.setItem("userInfo",userInfo);
    pain_h(userInfo);
}

// loginInput.addEventListener("submit", onLoginSubmit); 얘 왜 안되는건데
function pain_h(userInfo) {
    h.innerText=`hi ${userInfo}`;
    h.classList.remove("hidden");
}


const saveduserInfo = localStorage.getItem("userInfo")
if (saveduserInfo === null) {
    loginForm.classList.remove("hidden");
    loginInput.addEventListener("click", onLoginSubmit);
}
else {
    pain_h(saveduserInfo);
}

// 왜 시 발 다 안되는건데?

const link = document.querySelector("a")

function clickLick(event){
    event.preventDefault();
    console.log(event);
}

link.addEventListener("click", clickLick);

// const memo = document.querySelector("h1")

// memo.addEventListener("")