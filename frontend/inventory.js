function add_item(name, quantity, date) {
    const inventory_container = document.getElementById("inventory-container");
    const item = document.createElement("div");
    const today = new Date();
    item.classList.add("inventory-item");

    // Si la date est passée
    const parts = date.split("/");
    const newDate = new Date(parts[2], parts[1] - 1, parts[0]);
    const tempDate = newDate.toLocaleDateString();

    
    const diffTime = newDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log(diffDays);
    
    if (diffDays < 0) {
        item.classList.add("inventory-item-bigred");
    } else if (diffDays <= 6) {
        item.classList.add("inventory-item-red");
    } else if (diffDays <= 13) {
        item.classList.add("inventory-item-orange");
    } else {
        item.classList.add("inventory-item-green");
    }

    if (diffDays == 0) {
        item.innerHTML = `
        <p class="inventory-item-title">${name}</p>
        <p class="inventory-item-quantity">${quantity}</p>
        <p class="inventory-item-date" style="color: #179FF1;">${date}</p>
    `;
    } else {
        item.innerHTML = `
        <p class="inventory-item-title">${name}</p>
        <p class="inventory-item-quantity">${quantity}</p>
        <p class="inventory-item-date">${date}</p>
    `;
    }

    inventory_container.appendChild(item);
}
