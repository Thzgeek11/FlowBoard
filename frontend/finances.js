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
        if (!res.ok) throw new Error("Erreur lors de l'ajout du flux");
        return res.json();
    })
    .then(data => {
        console.log(data);
        if (data === "inflow") {
            const errorContainer = document.getElementById("error-message");
            errorContainer.innerText = "Erreur lors de l'ajout du flux";
            errorContainer.style.color = "red";
        }
    })
    .catch(err => {
        const errorContainer = document.getElementById("error-message");
        errorContainer.innerText = "Erreur lors de l'ajout du flux";
        errorContainer.style.color = "red";
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
                    <p class="flux-item-title">${influxCategory}</p>
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

function add_data_month(monthNb, year, amount) {
    const dataMonthContainer = document.getElementById("data-left");
    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Decembre"];

    const dataMonth = document.createElement("div");
    dataMonth.className = "data-month";
    dataMonth.innerHTML = `
        <p class="month-name">${months[monthNb - 1]} ${year.toString().slice(-2)}</p>
        <p class="month-amount">${amount}€</p>
        <p class="month-percent">10%</p>
    `;
    dataMonthContainer.appendChild(dataMonth);
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