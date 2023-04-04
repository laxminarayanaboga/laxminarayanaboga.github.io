var container = document.querySelector(".container");
var btn = document.querySelector(".btn");

const classList = ["orange", "sea-green", "purple", "green"];

var i = 0;
const n = classList.length;

btn.addEventListener("click", function () {

    var currentIndex = (i % n + n) % n;
    var nextIndex = currentIndex + 1;

    if (nextIndex >= n) {
        nextIndex = 0;
    }


    container.classList.remove(classList[currentIndex]);
    container.classList.add(classList[nextIndex]);
    console.log(`current index: ${nextIndex}, current color: ${classList[nextIndex]}`);

    i++;
});