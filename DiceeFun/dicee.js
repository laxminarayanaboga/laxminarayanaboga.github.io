var img1 = document.querySelector('.img1');
var img2 = document.querySelector('.img2');
var display = document.querySelector('.display');

function setImage(image1Or2, diceeNumber) {
    image1Or2.setAttribute('src', 'images/dice' + diceeNumber + '.png');
}

function generateRandomNumberBetween1To6() {
    return Math.floor(Math.random() * 6) + 1;
}

const player1Number = generateRandomNumberBetween1To6();
const player2Number = generateRandomNumberBetween1To6();

if (player1Number > player2Number) {
    display.textContent = "Player 1 Wins!";
} else if (player1Number < player2Number) {
    display.textContent = "Player 2 Wins!";
} else{
    display.textContent = "Draw!";
}

setImage(img1, player1Number);
setImage(img2, player2Number);

