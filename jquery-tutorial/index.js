

$("h1").addClass("big-title");
// $("button").css("color", "red");

// $(".text-box").keydown(function (event) {
//     $("h1").text(event.key);
// });


$("button").on("click", function () {
    $("h1").slideUp(1000).delay(800).slideDown(1000).animate({ opacity: 0.5 });
});