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
    minusBtn.type = "button";
    minusBtn.classList.add("inventory-item-button-operator-minus");

    const qtyEl = document.createElement("p");
    qtyEl.classList.add("inventory-item-quantity");
    qtyEl.textContent = quantity; // ex: "12 pcs" ou "5 kg" ou "6"

    const plusBtn = document.createElement("button");
    plusBtn.textContent = "+";
    plusBtn.type = "button";
    plusBtn.classList.add("inventory-item-button-operator-plus");

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "🗑️";
    removeBtn.type = "button";
    removeBtn.classList.add("inventory-item-button-remove");

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

    plusBtn.addEventListener("click", (e) => {
        e.preventDefault();   // empêche tout refresh
        updateQuantity(+1);
    });
    
    minusBtn.addEventListener("click", (e) => {
        e.preventDefault();
        updateQuantity(-1);
    });
    
    removeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        remove_item(item);
    });

    // Ajout à l'item
    item.appendChild(title);
    item.appendChild(minusBtn);
    item.appendChild(qtyEl);
    item.appendChild(plusBtn);
    item.appendChild(dateEl);
    item.appendChild(removeBtn);

    inventory_container.appendChild(item);
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

function refresh() {
    const inventory_items = Array.from(document.getElementsByClassName("inventory-item"));
    inventory_items.forEach(item => item.remove());

    get_products();
}

function get_products() {
    fetch("http://192.168.1.49:5600/inventory/get_products")
    .then(res => {
        if (!res.ok) throw new Error("Erreur lors de la récupération des produits");
        return res.json();
    })
    .then(data => {
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
        if (!res.ok) throw new Error("Erreur lors de la sauvegarde des produits");
        return res.json();
    })
    .catch(err => {
        const errorContainer = document.getElementById("error-message");
        errorContainer.innerHTML = "Erreur lors de la sauvegarde des produits";
        errorContainer.style.color = "red";
    });

    const recipe_button_plus = document.getElementsByClassName("recipe-ingredient-button");
    Array.from(recipe_button_plus).forEach(button => should_be_displayed(button));
}

function save_recipes() {
    const recipeContainers = document.querySelectorAll(".recipe-container");
    const recipes = [];

    recipeContainers.forEach(container => {
        const header = container.querySelector(".recipe-header");
        if (!header) return;

        const name = header.querySelector(".recipe-item-title")?.textContent.trim() || "";
        const quantity = header.querySelector(".recipe-item-quantite")?.textContent.trim() || "";
        const temps = header.querySelector(".recipe-item-temps")?.textContent.trim() || "";
        
        const ingredients = [];
        const ingredientElements = container.querySelectorAll(".recipe-ingredient");
        ingredientElements.forEach(ingredientEl => {
            const nameElement = ingredientEl.querySelector("p:first-child");
            const quantityElement = ingredientEl.querySelector("p:not(:first-child)");
            
            const name = nameElement ? nameElement.textContent.trim() : "";
            // On prend le premier paragraphe qui n'est pas le premier (pour éviter les problèmes si plusieurs paragraphes)
            const quantity = quantityElement ? quantityElement.textContent.trim() : "";
            
            if (name) {
                ingredients.push({ name, quantity });
            }
        });

        if (name) {
            recipes.push({
                name,
                quantity,
                temps,
                ingredients
            });
        }
    });
    
    fetch("http://192.168.1.49:5600/inventory/save_recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipes)
    })
    .then(res => {
        if (!res.ok) throw new Error("Erreur lors de la sauvegarde des recettes");
        return res.json();
    })
    .then(data => {
        closePopup2(); // Fermer la popup après sauvegarde
    })
    .catch(err => {
        console.error("Erreur:", err);
        const errorContainer = document.getElementById("error-message");
        errorContainer.textContent = "Erreur lors de la sauvegarde des recettes";
        errorContainer.style.color = "red";
    });
}

function add_recipe() {
    const name = document.getElementById("name").value;
    const quantity = document.getElementById("quantity").value;
    let date = document.getElementById("date").value; // format HTML input = YYYY-MM-DD

    if (!name || !quantity || !date) return;
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

function openPopup() {
    refresh();
    const popup = document.getElementById("popup-1");
    popup.style.display = "flex";
}

function closePopup() {
    const popup = document.getElementById("popup-1");
    popup.style.display = "none";
}

function openPopup2() {
    refresh();
    const popup = document.getElementById("popup-2");
    popup.style.display = "flex";
}

function popup2_add_ingredient() {
    const popup2_container = document.getElementById("popup2-container");
    
    const inputTitle = document.createElement("div");
    inputTitle.classList.add("input-title");
    inputTitle.textContent = "Ingrédients";
    inputTitle.style.marginRight = "14px";
    
    const ingredientInput = document.createElement("input");
    ingredientInput.classList.add("popup2-ingredient");
    ingredientInput.type = "text";
    ingredientInput.placeholder = "Riz";
    ingredientInput.style.marginRight = "6.5px";
    
    const quantityInput = document.createElement("input");
    quantityInput.classList.add("popup2-quantity");
    quantityInput.type = "text";
    quantityInput.placeholder = "75g";
    
    
    const br = document.createElement("br");
    
    // Insérer avant les 3 derniers éléments
    const insertPosition = popup2_container.children.length - 4;
    popup2_container.insertBefore(br.cloneNode(), popup2_container.children[insertPosition]);
    popup2_container.insertBefore(br, popup2_container.children[insertPosition]);
    popup2_container.insertBefore(quantityInput, popup2_container.children[insertPosition]);
    popup2_container.insertBefore(ingredientInput, popup2_container.children[insertPosition]);
    popup2_container.insertBefore(inputTitle, popup2_container.children[insertPosition]);  
}

function popup2_add_recipe() {
    const name = document.getElementById("popup2-name").value;
    let quantity = document.getElementById("popup2-quantity").value;
    let temps = document.getElementById("popup2-date").value;
    const ingredients = Array.from(document.querySelectorAll(".popup2-ingredient"))
        .map((input, index) => {
            const name = input.value;
            const quantityInput = document.querySelectorAll(".popup2-quantity")[index];
            const quantity = quantityInput ? quantityInput.value : "";
            return { name, quantity };
        })
        .filter(ingredient => ingredient.name); // Ne pas ajouter les ingrédients sans nom

    if (temps == NaN) {
        temps = "???min";
    } else {
        const [hours, minutes] = temps.split(":");
        temps = parseInt(hours) * 60 + parseInt(minutes) + "min";
    }
    
    if (quantity == 1) {
        quantity = quantity + " personne";
    } else {
        quantity = quantity + " personnes";
    }
    
    add_recipe(name, quantity, temps, ingredients);
    save_recipes();
    closePopup2();
}

function get_recipes() {
    fetch("http://192.168.1.49:5600/inventory/get_recipes")
    .then(res => {
        if (!res.ok) throw new Error("Erreur lors de la récupération des recettes");
        return res.json();
    })
    .then(data => {
        data.forEach(recipe => {
            add_recipe(recipe.name, recipe.quantity, recipe.temps, recipe.ingredients);
        });
    })
    .catch(err => {
        const errorContainer = document.getElementById("error-message");
        errorContainer.innerHTML = "Erreur lors de la récupération des recettes";
        errorContainer.style.color = "red";
    });
}

function add_recipe(name, quantity, temps, ingredients) {
    const rightContainer = document.getElementById("right-container");

    if (!rightContainer) {
        console.error("Right container not found");
        return;
    }

    const recipeContainer = document.createElement("div");
    recipeContainer.classList.add("recipe-container");
    
    const recipeHeader = document.createElement("div");
    recipeHeader.classList.add("recipe-header");
    
    const recipeTitle = document.createElement("p");
    recipeTitle.classList.add("recipe-item-title");
    recipeTitle.textContent = name;
    
    const recipeQuantity = document.createElement("p");
    recipeQuantity.classList.add("recipe-item-quantite");
    recipeQuantity.textContent = quantity;
    
    const recipeTime = document.createElement("p");
    recipeTime.classList.add("recipe-item-temps");
    recipeTime.textContent = temps;
    
    const recipeButton = document.createElement("button");
    recipeButton.classList.add("recipe-item-button");
    recipeButton.textContent = "+";
    
    recipeHeader.appendChild(recipeTitle);
    recipeHeader.appendChild(recipeQuantity);
    recipeHeader.appendChild(recipeTime);
    recipeHeader.appendChild(recipeButton);
    
    const recipeIngredients = document.createElement("div");
    recipeIngredients.classList.add("recipe-ingredients");
    
    ingredients.forEach(ingredient => {
        const ingredientElement = document.createElement("div");
        ingredientElement.classList.add("recipe-ingredient");
        
        const ingredientName = document.createElement("p");
        ingredientName.textContent = ingredient.name;
        
        const ingredientQuantity = document.createElement("p");
        ingredientQuantity.textContent = ingredient.quantity;
        
        const ingredientButton = document.createElement("button");
        ingredientButton.textContent = "+";
        ingredientButton.classList.add("recipe-ingredient-button");
        ingredientButton.addEventListener("click", () => {
            add_to_course_list(ingredient.name, ingredient.quantity);
        });

        ingredientElement.appendChild(ingredientName);
        ingredientElement.appendChild(ingredientQuantity);
        ingredientElement.appendChild(ingredientButton);
        
        recipeIngredients.appendChild(ingredientElement);
        should_be_displayed(ingredientButton);
    });
    
    recipeContainer.appendChild(recipeHeader);
    recipeContainer.appendChild(recipeIngredients);
    
    rightContainer.appendChild(recipeContainer);

    recipeButton.addEventListener("click", () => {
        add_whole_recipe(ingredients);
    });
    
}

function add_to_course_list(ingredientName, ingredientQuantity) {
    if (ingredientQuantity == "") {
        ingredientQuantity = "1";
    }
    fetch("http://192.168.1.49:5600/inventory/add_to_course_list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: ingredientName, quantity: ingredientQuantity, actual_quantity: "", date: "", checked: false })
    })
    .then(res => {
        if (!res.ok) {
            showNotification("⚠️ Erreur lors de l'ajout du produit à la liste de courses");
            throw new Error("Erreur lors de l'ajout du produit à la liste de courses");
        } else {
            showNotification("🛒 Produit ajouté à la liste de courses");
        }
        return res.json();
    })
    .then(data => {
        console.log(data);
    })
    .catch(err => console.error(err));
}

function add_whole_recipe(ingredients) {
    console.log(ingredients);

    ingredients.forEach((ingredient, index) => {
        setTimeout(() => {
            if (ingredient.quantity == "") {
                ingredient.quantity = "1";
            }
            add_to_course_list(ingredient.name, ingredient.quantity);
        }, 200 * index);
    });
    showNotification("🛒 Recette ajoutée à la liste de courses");
}

function closePopup2() {
    const popup = document.getElementById("popup-2");
    popup.style.display = "none";
}

function should_be_displayed(button) {
    const ingredientName = button.parentElement.children[0].textContent;
    let ingredientQuantity = button.parentElement.children[1].textContent;

    if (ingredientQuantity == "") {
        ingredientQuantity = 0;
    }

    fetch("http://192.168.1.49:5600/inventory/have_enough_product/" + ingredientName + "/" + ingredientQuantity)
        .then(res => res.json())
        .then(data => {
            const should_be_displayed = !data;
            button.style.display = should_be_displayed ? "block" : "none";
        })
        .catch(err => console.error(err));
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

// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', function() {
    get_products();
    get_recipes();
});