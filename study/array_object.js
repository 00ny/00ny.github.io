const a=["mon",null,3,4,undefined,"go"]

console.log(a)

//========================//

const player = {
    name : "woony",
    points:10,
    fat:false,
};

console.log(player);
console.log(player.name);

player.fat="true";

console.log(player.fat);

player.lastName="cloud";
console.log(player);

player.points = player.points +15;
console.log(player.points);