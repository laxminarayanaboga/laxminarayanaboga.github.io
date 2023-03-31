var drumButtons = document.querySelectorAll(".drum");


for (var i = 0; i < drumButtons.length; i++) {
    drumButtons[i].addEventListener("click", handleClick);
}

function handleClick() {
    console.log(this.innerHTML);
    // this.style.color="white";
    var audio = new Audio(audioMapping[this.innerHTML]);
    audio.play();
}




var audioMapping = {
    "w":"sounds/tom-1.mp3",
    "a":"sounds/tom-2.mp3",
    "s":"sounds/tom-3.mp3",
    "d":"sounds/tom-4.mp3",
    "j":"sounds/snare.mp3",
    "k":"sounds/crash.mp3",
    "l":"sounds/kick-bass.mp3",
};