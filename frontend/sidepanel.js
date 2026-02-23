let isOpen = true;

function toggleMenu() {
    const sidepanel = document.getElementById('sidepanel');
    const sidepanel_header_burger = document.getElementById('sidepanel-header-burger');
    const sidepanel_list = document.getElementById('sidepanel-list');

    if (!isOpen) {
        sidepanel.style.transform = 'translateX(0)';
        sidepanel.style.transition = 'transform 0.3s ease';
        sidepanel_list.style.filter = 'invert(0%)';
        sidepanel_header_burger.style.filter = 'invert(0%)';
        sidepanel_header_burger.style.transform = 'translateX(0)';
        sidepanel_header_burger.style.transition = 'transform 0.3s ease';
    } else {
        sidepanel.style.transform = 'translateX(-250px)';
        sidepanel.style.transition = 'transform 0.3s ease';
        sidepanel_header_burger.style.transform = 'translateX(250px)';
        sidepanel_header_burger.style.transition = 'transform 0.3s ease';
        sidepanel_header_burger.style.filter = 'invert(100%)';
    }
    isOpen = !isOpen;
}

function fetchSidepanel() {
    fetch('/frontend/sidepanel.html')
      .then(res => {
        if (!res.ok) throw new Error('Erreur chargement sidepanel: ' + res.status);
        return res.text();
      })
      .then(html => document.getElementById('sidepanel').innerHTML = html)
      .catch(err => {
        console.error(err);
        // fallback minimal si fetch échoue
        document.getElementById('sidepanel').innerHTML =
          '<nav><a href="/frontend/dashboard.html">Dashboard</a></nav>';
      });

      const input = document.getElementById("date");
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0'); // mois sur 2 chiffres
      const dd = String(today.getDate()).padStart(2, '0'); // jour sur 2 chiffres
      input.value = `${yyyy}-${mm}-${dd}`;
}

window.addEventListener("orientationchange", () => {
    if (isOpen == false) {
        toggleMenu();
    }
});

window.onload = () => {
    if (window.innerWidth < 800) {
        return new Promise(resolve => setTimeout(toggleMenu, 100)).then(resolve => setTimeout(resolve, 1000));
    }
};
