const images = ["js-002.png","js-001.png","js-002.png","js-000.png"];
const body = document.querySelector("body");

function change() {
    console.log("you clicked!")
    const chosenImage = images[Math.floor(Math.random()*images.length)];
    console.log(chosenImage)
    
    const box_of_img = document.createElement("div");
    const bgImage = document.createElement("img");
    
    bgImage.src = `img/${chosenImage}`;
    
    document.body.appendChild(box_of_img);
    box_of_img.appendChild(bgImage);
    box_of_img.classList.add("imgBox");
}

change();
body.addEventListener("click",change)