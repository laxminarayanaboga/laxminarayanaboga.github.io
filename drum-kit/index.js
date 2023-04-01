// const

const audioMapping = {
    "w": "sounds/tom-1.mp3",
    "a": "sounds/tom-2.mp3",
    "s": "sounds/tom-3.mp3",
    "d": "sounds/tom-4.mp3",
    "j": "sounds/snare.mp3",
    "k": "sounds/crash.mp3",
    "l": "sounds/kick-bass.mp3",
};


// Dom objects
var drumButtons = document.querySelectorAll(".drum");


// Event Listeners
for (var i = 0; i < drumButtons.length; i++) {
    drumButtons[i].addEventListener("click", handleClick);
}

document.addEventListener("keydown", function (event) {
    makeSound(event.key);
    buttonAnimation(event.key);
});


// Reusable functions
function handleClick() {
    makeSound(this.innerHTML);
    buttonAnimation(this.innerHTML);
}

function makeSound(keyStroke) {
    var audio = new Audio(audioMapping[keyStroke]);
    audio.play();
}

function buttonAnimation(keyStroke) {
    var activeButton = document.querySelector(`.${keyStroke}`);
    activeButton.classList.add("pressed");
    setTimeout(function () {
        activeButton.classList.remove("pressed");
    }, 100);
}