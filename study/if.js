const age = parseInt(prompt("How old r u?"));

if (isNaN(age) || age<0) {
    console.log("Please write a real positive number");
} else if (age < 18) {
    console.log("u r too young");
} else if (age >= 18 && age <=50) {
    console.log("you can drink");
} else if (age > 50 && age <=80) {
    console.log("you should exercise");
} else if (age>80) {
    console.log("you can do whatever you want.")
}


//이게 >80 위에 있어야 하는 이유, else if는 양자 택일이기 때문이다.
else if(age === 100) {
    console.log("wow you are wise");
}