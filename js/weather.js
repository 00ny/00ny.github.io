const KEY = "f51347d6b141e9eb2e0d9fefdfab387e"

function onGeoOK(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    console.log("You live in", latitude, longitude);
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${KEY}&units=metric`
    fetch(url).then(respone => respone.json()).then(data => {
        const weatherContainer = document.querySelector("#weather span:first-child")
        const cityContainer = document.querySelector("#weather span:last-child")
        const location = data.name;
        const weather = data.weather[0].main;
        weatherContainer.innerText = `${weather} / ${data.main.temp}`;
        cityContainer.innerText = location;
    })
}

function onGeoError() {
    alert("can't find you")
}

navigator.geolocation.getCurrentPosition(onGeoOK , onGeoError)