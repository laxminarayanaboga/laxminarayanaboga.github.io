var inputTextBox = document.querySelector("#input-text");
var displayCount = document.querySelector("#display-text-count");

console.log(displayCount);

inputTextBox.addEventListener("keyup", function(event){
    console.log(inputTextBox.value.length);
    console.log(event);
    displayCount.textContent=inputTextBox.value.length;
});