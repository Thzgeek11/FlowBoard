document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
        window.location.href = "error403.html";
    } else {
        checkAccess(token);
    }
});

function checkAccess(token) {
    fetch("http://127.0.0.1:5600/api/check_access", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": localStorage.getItem("authToken")
        },
        body: JSON.stringify({ token })
    })
    .then(res => res.json())   // ⚠️ PAS de res.ok ici
    .then(data => {
        console.log("Response:", data);

        if (data.status === "success") {
            console.log("Access granted");
        } else {
            window.location.href = "error403.html";
        }
    })
    .catch(err => {
        console.error(err);
        window.location.href = "error403.html";
    });
}

function logout() {
    localStorage.removeItem("authToken");
    window.location.href = "index.html";
}