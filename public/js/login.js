document.getElementById("login-form").addEventListener("submit", function(event){
    event.preventDefault();
    logIn();
});

document.getElementById("register-form").addEventListener("submit", function(event){
    event.preventDefault();
    register();
});

document.getElementById("direct-chess").addEventListener("click", function(){
    window.location.href = '/chess.html';
});

function logIn(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    }).then(response => response.json()).then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            window.location.href = '/chess';  // Redirect to the chess page
        }
    });
}

function register(event) {
    event.preventDefault();

    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    }).then(response => response.json()).then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(`Registered ${username}`);
        }
    });
}
