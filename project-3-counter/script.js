var counterNumber = document.querySelector("#counter-number");
var counterIncrease = document.querySelector("#counter-increase");
var counterDecrease = document.querySelector("#counter-decrease");

counterIncrease.addEventListener("click", function (event) {
    let current = Number(counterNumber.textContent);
    counterNumber.textContent = current + 1;
});

counterDecrease.addEventListener("click", function (event) {
    let current = Number(counterNumber.textContent);
    counterNumber.textContent = current - 1;
});