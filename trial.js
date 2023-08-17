var audio = new Audio("voice.mp3");
// document.querySelector("#photo").addEventListener("click",handleClick);
// function handleClick(){
//     audio.play();
// }
$("#photo").on("mouseover" , function(){
    audio.play();
});

