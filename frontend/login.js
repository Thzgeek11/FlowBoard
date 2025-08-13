
async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // convertit en hexadécimal
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}
  
async function login() {
    // récupère les valeurs
    const username = document.getElementById("username").value.toLowerCase();
    const password = document.getElementById("password").value.toLowerCase();

    const validUsername = "thzgeek";
    const validPassword = "7551";//"78e837bb99a959e829285e58086564de711a8127116acbc1da78f54b49473c45";

    if (username === validUsername && password === validPassword) {
        window.location.href = "/frontend/dashboard.html";
    } else {
        alert("Nom d'utilisateur ou mot de passe incorrect");
    }
}
