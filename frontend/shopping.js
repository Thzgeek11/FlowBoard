/* Ajout visuel d'un produit */
function addShoppingItem(itemName, itemQuantity, itemActualQuantity = "", itemDate = "", itemChecked = false, save_shopping = true) {
    const listContainer = document.querySelector('.list-item-container');
    const listElement = document.createElement('div');
    listElement.classList.add('list-item');

    listElement.innerHTML = `
        <p class="list-item-square" style="font-size: 24px;"><a href="#" onclick="validateShoppingItem(this)">⬜</a></p>
        <p class="list-item-name">${itemName}</p>
        <p style="color: #747474;" class="mobile-hidden" id="mobile-hidden1">Minimum</p>
        <p class="list-item-quantity">${itemQuantity}</p>
        <p style="color: #747474;" class="mobile-hidden" id="mobile-hidden2">Quantité</p>
        <input class="list-item-quantity-input" placeholder="75g">
        <p style="color: #747474;" class="mobile-hidden" id="mobile-hidden3">Péremption</p>
        <input class="list-item-date-input" id="date" type="date">
        <button class="list-item-delete-button" onclick="deleteShoppingItem(this)">🗑️</button>`;
    listContainer.appendChild(listElement);

    if (itemActualQuantity != "") {
        listElement.children[5].value = itemActualQuantity;
    }

    if (itemDate != "") {
        listElement.children[7].value = unformatDate(itemDate);
    }

    if (itemChecked) {
        validateShoppingItem(listElement.children[0].children[0], false);
    }

    

    if (save_shopping) saveShopping();
}

/* Suppression visuelle d'un produit */
function deleteShoppingItem(button) {
    const listElement = button.parentElement;
    listElement.remove();
    saveShopping();
}

/* Validation visuelle d'un produit */
function validateShoppingItem(a, save_shopping = true) {
    const listElement = a.parentElement.parentElement;

    if (listElement.children[5].value == "") {
        alert("Veuillez entrer une quantité");
        return;
    }

    if (listElement.children[7].value == "") {
        alert("Veuillez entrer une date de péremption");
        return;
    }

    if (a.innerHTML == "✅") {
        return;
    }

    a.innerHTML = "✅";

    listElement.children[1].style.textDecoration = "line-through";
    listElement.children[1].style.textDecorationThickness = "4px";
    listElement.children[1].style.textDecorationColor = "black";

    listElement.children[2].style.textDecoration = "line-through";
    listElement.children[2].style.textDecorationThickness = "4px";
    listElement.children[2].style.textDecorationColor = "black";

    listElement.children[3].style.textDecoration = "line-through";
    listElement.children[3].style.textDecorationThickness = "4px";
    listElement.children[3].style.textDecorationColor = "black";

    listElement.children[4].style.textDecoration = "line-through";
    listElement.children[4].style.textDecorationThickness = "4px";
    listElement.children[4].style.textDecorationColor = "black";

    listElement.children[6].style.textDecoration = "line-through";
    listElement.children[6].style.textDecorationThickness = "4px";
    listElement.children[6].style.textDecorationColor = "black";

    moveToBottom(listElement);
    if (save_shopping) {
        console.log("saveShopping");
        addShoppingItemToInventory(listElement);
        saveShopping();
    }
}

/* Ajout visuel d'un produit dans l'inventaire */
function addShoppingItemToInventory(listElement) {
    console.log("addShoppingItemToInventory");
    if (listElement.children[5].value == "" || listElement.children[7].value == "" || listElement.children[0].children[0].innerHTML != "✅") {
        console.log(listElement.children[5].value, listElement.children[7].value, listElement.children[0].children[0].innerHTML);
        throw new Error("Le produit n'est pas valide");
    }
    
    const name = listElement.querySelector(".list-item-name").textContent.trim();
    const quantity = listElement.querySelector(".list-item-quantity").textContent.trim();
    const actual_quantity = listElement.querySelector(".list-item-quantity-input").value.trim();
    const date = formatDate(listElement.querySelector(".list-item-date-input").value);
    
    fetch("http://192.168.1.49:5600/shopping/add_shopping_item_to_inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, quantity, actual_quantity, date, checked: true })
    })
    .then(res => {
        if (!res.ok) throw new Error("Erreur lors de l'ajout du produit");
        alert("Produit ajouté à l'inventaire");
        return res.json();
    })
    .catch(err => {
        console.error(err);
    });
}

/* Déplacement visuel d'un produit */
function moveToBottom(listElement) {
    const listContainer = document.querySelector('.list-item-container');
    listContainer.appendChild(listElement);
}

function saveShopping() {
    const shopping = Array.from(document.querySelectorAll(".list-item")).map(item => {
        const name = item.querySelector(".list-item-name").textContent.trim();
        const quantity = item.querySelector(".list-item-quantity").textContent.trim();
        const actual_quantity = item.querySelector(".list-item-quantity-input").value.trim();
        const date = formatDate(item.querySelector(".list-item-date-input").value);
        return { name, quantity, actual_quantity, date, checked: item.querySelector(".list-item-square").textContent === "✅"};
    });
    fetch("http://192.168.1.49:5600/shopping/save_shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shopping)
    })
    .then(res => {
        if (!res.ok) throw new Error("Erreur lors de la sauvegarde des courses");
        return res.json();
    })
    .catch(err => {
        console.error(err);
    });
}

function getShopping() {
    fetch("http://192.168.1.49:5600/shopping/get_shopping")
    .then(res => {
        if (!res.ok) throw new Error("Erreur lors de la récupération des courses");
        return res.json();
    })
    .then(shopping => {
        console.log("Shopping :", shopping);
        shopping.forEach(item => {
            addShoppingItem(item.name, item.quantity, item.actual_quantity, item.date, item.checked, false);
        });
    })
    .catch(err => {
        console.error(err);
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

function unformatDate(date) {
    if (date.includes("/")) {
        // format DD/MM/YYYY → YYYY-MM-DD
        const [day, month, year] = date.split("/");
        return `${year}-${month}-${day}`;
    }
    // sinon, on suppose que c'est déjà YYYY-MM-DD
    return date;
}

document.addEventListener("input", event => {
    if (event.target.classList.contains("list-item-quantity-input") || event.target.classList.contains("list-item-date-input")) {
        saveShopping();
    }
});
