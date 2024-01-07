const loginForm = document.getElementById("login-fform")
// const loginForm = document.querySelector("#login-fform")
// 이제 login-form이 선택된것이다.

const h = document.querySelector("h1");


function onLoginSubmit(event){
    event.preventDefault();
    const userInfo = document.getElementById("a").value;
    loginForm.classList.toggle("hidden");
    localStorage.setItem("userInfo",userInfo);
    pain_h(userInfo);
}

function pain_h(userInfo) {
    h.innerText=`hi ${userInfo}`;
    h.classList.remove("hidden");
}


const saveduserInfo = localStorage.getItem("userInfo")

first();
function first() {
    if (saveduserInfo === null) {
        loginForm.classList.toggle("hidden");
        loginForm.addEventListener("submit", onLoginSubmit);
    }
    else {
        pain_h(saveduserInfo);
    }    
}
