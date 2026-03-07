function login() {
    const username = document.querySelector('input[name="username"]').value;
    const password = document.querySelector('input[name="password"]').value;
    
    fetch(`http://127.0.0.1:5600/api/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({username, password})
    })
    .then(res => {
        if (!res.ok) throw new Error("Error logging in");
        return res.json();
    })
    .then(data => {
        if (data["status"] === "success") {
            document.getElementById("error-message").style.color = "green";
            document.getElementById("error-message").innerText = "Login successful";
            // Store token in localStorage or sessionStorage
            localStorage.setItem("authToken", data["token"]);
            window.location.href = "dashboard.html";
        } else {
            localStorage.removeItem("authToken");
            document.getElementById("error-message").style.color = "red";
            document.getElementById("error-message").innerText = data["message"];
        }
    })
    .catch(err => {
        console.error(err);
        document.getElementById("error-message").style.color = "red";
        document.getElementById("error-message").innerText = "Login failed";
    });
}