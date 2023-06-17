document.getElementById("login-form").addEventListener("submit", function(event){
    event.preventDefault(); // to stop the form from submitting
    logIn();
});

document.getElementById("register-form").addEventListener("submit", function(event){
    event.preventDefault(); // to stop the form from submitting
    register();
});

function logIn() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === "admin" && password === "admin") {  // for example
        window.location.href = '/chess';  // Redirect to the chess page
    } else {
        alert("Invalid username or password");
    }
}

function register() {
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;

    // Registration logic here
    alert(`Registered ${username}`);
}
