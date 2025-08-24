function openPopup() {
    document.getElementById("popup-overlay").style.display = "flex";
}
  
function closePopup() {
    document.getElementById("popup-overlay").style.display = "none";
}


document.addEventListener("DOMContentLoaded", onLoad);

/* LOADER */

function onLoad() {
    document.getElementById("loader-background").style.display = "none";
}