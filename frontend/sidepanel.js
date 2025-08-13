let isOpen = true;

function toggleMenu() {
    const sidepanel = document.getElementById('sidepanel');
    const sidepanel_header_burger = document.getElementById('sidepanel-header-burger');
    const sidepanel_list = document.getElementById('sidepanel-list');

    console.log(isOpen);
    if (!isOpen) {
        sidepanel.style.transform = 'translateX(0)';
        sidepanel.style.transition = 'transform 0.3s ease';
        sidepanel_list.style.filter = 'invert(0%)';
        sidepanel_header_burger.style.filter = 'invert(0%)';
        sidepanel_header_burger.style.transform = 'translateX(0)';
        sidepanel_header_burger.style.transition = 'transform 0.3s ease';
        console.log("Menu ouvert");
    } else {
        sidepanel.style.transform = 'translateX(-250px)';
        sidepanel.style.transition = 'transform 0.3s ease';
        sidepanel_header_burger.style.transform = 'translateX(250px)';
        sidepanel_header_burger.style.transition = 'transform 0.3s ease';
        sidepanel_header_burger.style.filter = 'invert(100%)';
        console.log("Menu fermé");
    }
    isOpen = !isOpen;
}

window.addEventListener("orientationchange", () => {
    location.reload();
});
