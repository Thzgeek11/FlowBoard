const BUDGET = 216;

function add_flow() {
    let dateValue = document.getElementById("date").value;
    
    // Reformater au format DD/MM/YYYY
    let [year, month, day] = dateValue.split("-");
    let formattedDate = `${day}/${month}/${year}`;

    fetch("http://localhost:5600/finances/add_flow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": localStorage.getItem("authToken")
        },
        body: JSON.stringify({
            category: document.getElementById("category").value,
            amount: document.getElementById("amount").value,
            date: String(formattedDate)
        })
    })
    .then(res => {
        console.log(res);
        showNotification("✅ Flux ajouté avec succès");
        if (!res.ok) throw new Error("Erreur lors de l'ajout du flux");
        return res.json();
    })
    .then(data => {
        console.log(data);
        if (data === "inflow") {
            const errorContainer = document.getElementById("error-message");
            errorContainer.innerText = "Erreur lors de l'ajout du flux";
            errorContainer.style.color = "red";
            showNotification("❌ Erreur lors de l'ajout du flux");
        }
    })
    .catch(err => {
        const errorContainer = document.getElementById("error-message");
        errorContainer.innerText = "Erreur lors de l'ajout du flux";
        errorContainer.style.color = "red";
        showNotification("❌ Erreur lors de l'ajout du flux");
    });
}
  
function get_graph() {
    fetch("http://localhost:5600/finances/get_graph", {
        headers: {
            "X-API-Key": localStorage.getItem("authToken")
        }
    })
        .then(res => res.blob()) // <- récupérer le contenu binaire
        .then(blob => {
            // Créer une URL utilisable dans un <img>
            const imgUrl = URL.createObjectURL(blob);

            // Créer / cibler un <img> dans le DOM
            const img = document.getElementById("graph-img");
            img.src = imgUrl;
        })
        .catch(err => console.error(err));
}

let historyNumber = 13;

function get_history(number = historyNumber) {
    fetch("http://localhost:5600/finances/get_history/" + number, {
        headers: {
            "X-API-Key": localStorage.getItem("authToken")
        }
    })
        .then(res => res.json())
        .then(data => {
            const rightContainerTop = document.getElementById("right-container-top");
            rightContainerTop.innerHTML = "<div id=\"right-container-title\" class=\"title-sticky\" style=\"display: flex; justify-content: space-between; text-indent: 16px;\"><p>Historique des derniers flux</p><button onclick=\"openPopup()\" class=\"title-button\">+</button></div>";
            data.forEach(flow => {
                const influx = flow.amount > 0;
                const influxClass = influx ? "influx" : "outflux";
                const influxText = influx ? "+" : "-";
                const influxAmount = influx ? flow.amount : -flow.amount;
                const influxCategory = flow.category;
                const influxDate = flow.date;

                const item = document.createElement("div");
                item.classList.add(influxClass);
                item.innerHTML = `
                    <p class="flux-item-title scroll-text">${influxCategory}</p>
                    <p class="flux-item-quantity">${influxText}${influxAmount}€</p>
                    <p class="flux-item-date">${influxDate}</p>
                `;
                rightContainerTop.appendChild(item);
            });
            rightContainerTop.innerHTML += "<button class=\"flux-button\" style=\"margin-right: 30px;\" onclick=\"increase_flux_viewed(5)\">En voir +5</button>";
            rightContainerTop.innerHTML += "<button class=\"flux-button\" style=\"margin-left: 30px;\" onclick=\"increase_flux_viewed(10)\">En voir +10</button>";
        })
        .catch(err => console.error(err));
}

function get_months() {
    fetch("http://localhost:5600/finances/get_months", {
        headers: {
            "X-API-Key": localStorage.getItem("authToken")
        }
    })
        .then(res => res.json()) // <- récupérer le contenu binaire
        .then(json => {
            Object.entries(json).forEach((monthData) => {
                const year = monthData[1][0];
                const monthNb = monthData[1][1];
                const amount = monthData[1][2];
                add_data_month(monthNb, year, amount);
            });
            
        })
        .catch(err => console.error(err));
}

function get_actual_month() {
    fetch("http://localhost:5600/finances/get_actual_month", {
        headers: {
            "X-API-Key": localStorage.getItem("authToken")
        }
    })
        .then(res => res.json())
        .then(json => {
            if (json !== null) {
                add_current_month_data(json[2]);
            }
        })
        .catch(err => console.error(err));
}

function add_data_month(monthNb, year, amount) {
    const dataMonthContainer = document.getElementById("data-left");
    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Decembre"];

    const dataMonth = document.createElement("div");
    dataMonth.className = "data-month";
    dataMonth.innerHTML = `
        <p class="month-name">${months[monthNb - 1]} ${year.toString().slice(-2)}</p>
        <p class="month-amount">${amount.toFixed(0)}€</p>
        <p class="month-percent">${((amount/BUDGET)*100).toFixed(0)}%</p>
    `;
    dataMonthContainer.appendChild(dataMonth);
}

function add_current_month_data(amount) {
    let spend = -amount;
    const currentMonthAmount = document.getElementById("current-month-amount");
    const currentMonthBudget = document.getElementById("current-month-budget");
    const currentMonthPercent = document.getElementById("current-month-percent");

    const percent = (spend / BUDGET) * 100;

    currentMonthAmount.textContent = spend.toFixed(2) + "€";
    currentMonthBudget.textContent = BUDGET.toFixed(2) + "€";
    currentMonthPercent.textContent = percent.toFixed(0) + "%";

    currentMonthPercent.style.setProperty("--ring-color", getColor(percent));
}

function getColor(percent) {
    // Fait par IA parce que c'est pas le but du projet
    percent = Math.min(Math.max(percent, 0), 100); // limite 0-100

    let r, g, b;

    if (percent <= 50) {
        // De vert (#019A01) à jaune (#FFE500)
        const ratio = percent / 50;

        // Vert RGB(1,154,1)
        const rStart = 1, gStart = 154, bStart = 1;
        // Jaune RGB(255,229,0)
        const rEnd = 255, gEnd = 229, bEnd = 0;

        r = Math.floor(rStart + (rEnd - rStart) * ratio);
        g = Math.floor(gStart + (gEnd - gStart) * ratio);
        b = Math.floor(bStart + (bEnd - bStart) * ratio);

    } else {
        // De jaune (#FFE500) à rouge (#ED5353)
        const ratio = (percent - 50) / 50;

        // Jaune RGB(255,229,0)
        const rStart = 255, gStart = 229, bStart = 0;
        // Rouge RGB(205,0,1)
        const rEnd = 205, gEnd = 0, bEnd = 1;

        r = Math.floor(rStart + (rEnd - rStart) * ratio);
        g = Math.floor(gStart + (gEnd - gStart) * ratio);
        b = Math.floor(bStart + (bEnd - bStart) * ratio);
    }

    return `rgb(${r},${g},${b})`;
}

function increase_flux_viewed(number = 5) {
    historyNumber += number;
    get_history(historyNumber);
}

function openPopup() {
    const popup = document.getElementById("popup-1");
    popup.style.display = "flex";
}

function closePopup() {
    const popup = document.getElementById("popup-1");
    popup.style.display = "none";
}

function showNotification(text) {
    const notificationContainer = document.getElementById('notification-container');
    const notificationText = document.getElementById('notification-text');

    notificationText.textContent = text;
    notificationContainer.style.display = 'flex';
    setTimeout(() => {
        notificationContainer.style.display = 'none';
    }, 4000);
}

window.onload = function() {
    const input = document.getElementById("date");
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // mois sur 2 chiffres
    const dd = String(today.getDate()).padStart(2, '0'); // jour sur 2 chiffres
    input.value = `${yyyy}-${mm}-${dd}`;
}

// Faire par IA parce que flemme et pas super utile
// let fakePercent = 0;      // valeur initiale
// let direction = 1;        // +1 = augmente, -1 = diminue
// let oscillationInterval;  // stocke l'intervalle

// function startFakeOscillation() {
//     const currentMonthAmount = document.getElementById("current-month-amount");
//     const currentMonthPercent = document.getElementById("current-month-percent");

//     // Nettoie un intervalle existant
//     if (oscillationInterval) clearInterval(oscillationInterval);

//     oscillationInterval = setInterval(() => {
//         // Mise à jour de la valeur
//         fakePercent += direction * 1; // incrément 1% par intervalle

//         // Inverse la direction aux limites
//         if (fakePercent >= 100) {
//             fakePercent = 100;
//             direction = -1;
//         } else if (fakePercent <= 0) {
//             fakePercent = 0;
//             direction = 1;
//         }

//         // Mettre à jour le texte
//         currentMonthPercent.textContent = fakePercent.toFixed(0) + "%";
//         currentMonthAmount.textContent = ((fakePercent / 100) * BUDGET).toFixed(2) + "€";

//         // Mettre à jour la couleur du cercle
//         currentMonthPercent.style.setProperty("--ring-color", getColor(fakePercent));
//     }, 50); // toutes les 50ms → animation fluide
// }

// // Pour arrêter l'oscillation
// function stopFakeOscillation() {
//     if (oscillationInterval) clearInterval(oscillationInterval);
// }