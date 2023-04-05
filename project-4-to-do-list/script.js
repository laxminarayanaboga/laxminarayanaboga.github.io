var inputText = document.querySelector("#item-input-text");
var inputButton = document.querySelector("#item-input-button");
var gridContainer = document.querySelector("#grid-container");

inputButton.addEventListener("click", function () {
    if (inputText.value) {
        const display = document.createElement("span");
        const removeButton = document.createElement("button");

        display.setAttribute("class", "grid-item item-text");
        display.innerHTML = inputText.value;
        removeButton.setAttribute("class", "grid-item item-button btn btn-remove");
        removeButton.innerHTML = "REMOVE";

        gridContainer.appendChild(display);
        gridContainer.appendChild(removeButton);

        inputText.value = "";
    }
});


document.addEventListener("click", function (event) {

    if (event.target.classList.contains("btn-remove")) {
        console.log("you clicked on remove button");
        event.target.previousSibling.remove();
        event.target.remove();

    }

});

