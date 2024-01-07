const images = ["js-002.png","js-001.png","js-002.png","js-000.png"];

const chosenImage = images[Math.floor(Math.random()*images.length)];

const bgImage = document.createElement("img");

bgImage.src = `img/${chosenImage}`;

console.log(bgImage)

document.body.appendChild(bgImage);