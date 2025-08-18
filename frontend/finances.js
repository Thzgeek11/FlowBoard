function add_flow() {
    let dateValue = document.getElementById("date").value; // "2025-08-15"
    
    // Reformater au format DD/MM/YYYY
    let [year, month, day] = dateValue.split("-");
    let formattedDate = `${day}/${month}/${year}`;

    fetch("http://192.168.1.49:5600/finances/add_flow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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
            errorContainer.innerHTML = "Erreur lors de l'ajout du flux";
            errorContainer.style.color = "red";
        }
    })
    .catch(err => {
        const errorContainer = document.getElementById("error-message");
        errorContainer.innerHTML = "Erreur lors de l'ajout du flux";
        errorContainer.style.color = "red";
    });
}
  
function get_graph() {
    fetch("http://192.168.1.49:5600/finances/get_graph")
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

let historyNumber = 10;

function get_history(number = historyNumber) {
    fetch("http://192.168.1.49:5600/finances/get_history/" + number)
        .then(res => res.json())
        .then(data => {
            const rightContainerTop = document.getElementById("right-container-top");
            rightContainerTop.innerHTML = "<p id=\"right-container-title\" class=\"title-sticky\">Historique des derniers flux</p>";
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

function increase_flux_viewed(number = 5) {
    historyNumber += number;
    get_history(historyNumber);
    console.log(historyNumber);
}