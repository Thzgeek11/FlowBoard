function add_item(name, quantity, date) {
    const inventory_container = document.getElementById("inventory-container");
    const item = document.createElement("div");
    const today = new Date();
    item.classList.add("inventory-item");

    // Conversion de la date
    const parts = date.split("/");
    const newDate = new Date(parts[2], parts[1] - 1, parts[0]);
    const diffTime = newDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Couleur selon la date
    if (diffDays < 0) {
        item.classList.add("inventory-item-bigred");
    } else if (diffDays <= 6) {
        item.classList.add("inventory-item-red");
    } else if (diffDays <= 13) {
        item.classList.add("inventory-item-orange");
    } else {
        item.classList.add("inventory-item-green");
    }

    // Construction des éléments
    const title = document.createElement("p");
    title.classList.add("inventory-item-title");
    title.textContent = name;

    const minusBtn = document.createElement("button");
    minusBtn.textContent = "-";

    const qtyEl = document.createElement("p");
    qtyEl.classList.add("inventory-item-quantity");
    qtyEl.textContent = quantity; // ex: "12 pcs" ou "5 kg" ou "6"

    const plusBtn = document.createElement("button");
    plusBtn.textContent = "+";

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "🗑️";

    const dateEl = document.createElement("p");
    dateEl.classList.add("inventory-item-date");
    dateEl.textContent = date;
    if (diffDays === 0) {
        dateEl.style.color = "#179FF1";
    }

    // ➕➖ Gestion des clics
    function updateQuantity(change) {
        const text = qtyEl.textContent.trim();
        const match = text.match(/^(\d+)\s*(.*)$/); // sépare nombre + unité
        if (match) {
            let current = parseInt(match[1]);
            const unit = match[2] || "";
    
            // Règle d'incrément/décrément
            let step = current >= 50 ? 5 : 1;
            let newQty = current + change * step;
    
            if (newQty <= 0) {
                // Supprimer l'élément du DOM si quantité <= 0
                item.remove();
            } else {
                qtyEl.textContent = `${newQty}${unit}`.trim();
            }
            save_products();
        }
    }   

    function remove_item(item) {
        item.remove();
        save_products();
    }

    plusBtn.addEventListener("click", () => updateQuantity(+1));
    minusBtn.addEventListener("click", () => updateQuantity(-1));
    removeBtn.addEventListener("click", () => remove_item(item));

    // Ajout à l'item
    item.appendChild(title);
    item.appendChild(minusBtn);
    item.appendChild(qtyEl);
    item.appendChild(plusBtn);
    item.appendChild(dateEl);
    item.appendChild(removeBtn);

    inventory_container.appendChild(item);
}

function openPopup() {
    const popup = document.getElementById("popup-1");
    popup.style.display = "flex";
}

function add_product() {
    const name = document.getElementById("name").value;
    const quantity = document.getElementById("quantity").value;
    let date = document.getElementById("date").value; // format HTML input = YYYY-MM-DD

    if (!name || !quantity || !date) return;

    // Reformater en DD/MM/YYYY
    date = formatDate(date);

    add_item(name, quantity, date);
    save_products();
}


function get_products() {
    fetch("http://192.168.1.49:5600/inventory/get_products")
    .then(res => {
        console.log(res);
        if (!res.ok) throw new Error("Erreur lors de la récupération des produits");
        return res.json();
    })
    .then(data => {
        console.log(data);
        data.forEach(product => {
            // Reformater au format DD/MM/YYYY
            let formattedDate = formatDate(product.date);
            add_item(product.name, product.quantity, formattedDate);
        });
    })
    .catch(err => {
        const errorContainer = document.getElementById("error-message");
        errorContainer.innerHTML = "Erreur lors de la récupération des produits";
        errorContainer.style.color = "red";
    });
}

function save_products() {
    const products = Array.from(document.querySelectorAll(".inventory-item")).map(item => {
        const name = item.querySelector(".inventory-item-title").textContent.trim();
        const quantity = item.querySelector(".inventory-item-quantity").textContent.trim();
        const date = item.querySelector(".inventory-item-date").textContent.trim();
        return { name, quantity, date };
    });

    fetch("http://192.168.1.49:5600/inventory/save_products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(products)
    })
    .then(res => {
        console.log(res);
        if (!res.ok) throw new Error("Erreur lors de la sauvegarde des produits");
        return res.json();
    })
    .then(data => console.log(data))
    .catch(err => {
        const errorContainer = document.getElementById("error-message");
        errorContainer.innerHTML = "Erreur lors de la sauvegarde des produits";
        errorContainer.style.color = "red";
    });
}

function formatDate(date) {
    if (date.includes("-")) {
        // format YYYY-MM-DD → DD/MM/YYYY
        const [year, month, day] = date.split("-");
        return `${day}/${month}/${year}`;
    }
    // sinon, on suppose que c'est déjà DD/MM/YYYY
    return date;
}



function closePopup() {
    const popup = document.getElementById("popup-1");
    popup.style.display = "none";
}

function closePopup2() {
    const popup = document.getElementById("popup-2");
    popup.style.display = "none";
}

get_products();