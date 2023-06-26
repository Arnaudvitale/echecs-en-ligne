document.getElementById("login-form").addEventListener("submit", function(event){
    event.preventDefault();
    logIn(event);
});

document.getElementById("register-form").addEventListener("submit", function(event){
    event.preventDefault();
    register(event);
});

function showError(message, elementId) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.previousElementSibling.classList.add('error');
    errorElement.style.display = 'block';
}

function logIn(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const username = usernameInput.value;
    const password = passwordInput.value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    }).then(response => response.json()).then(data => {
        if (data.status === 'error') {
            if (data.message === 'Incorrect username or password') {
                usernameInput.style.borderColor = 'red';
                passwordInput.style.borderColor = 'red';
                showError(data.message, 'login-error');
            } else if (data.message === 'User not found') {
                usernameInput.style.borderColor = 'red';
                passwordInput.style.borderColor = '';
                showError(data.message, 'login-error');
            }
        } else {
            localStorage.setItem('username', data.username); // Save username in local storage
            localStorage.setItem('elo', data.elo); // Save Elo in local storage
            window.location.href = '/chess.html';  // Redirect to the chess page
            usernameInput.style.borderColor = '';
            passwordInput.style.borderColor = '';
        }
    });
}

function register(event) {
    event.preventDefault();

    const usernameInput = document.getElementById('reg-username');
    const passwordInput = document.getElementById('reg-password');
    const successElement = document.getElementById('register-success');
    const errorElement = document.getElementById('register-error');
    const username = usernameInput.value;
    const password = passwordInput.value;

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    }).then(response => response.json()).then(data => {
        if (data.status === 'error') {
            usernameInput.style.borderColor = 'red';
            showError(data.message, 'register-error');
            passwordInput.style.borderColor = '';
            successElement.style.display = 'none';
            errorElement.style.display = 'block';
        } else {
            successElement.textContent = `Registered ${username}`;
            successElement.style.display = 'block';
            errorElement.style.display = 'none';
            usernameInput.style.borderColor = '';
            passwordInput.value = '';
            usernameInput.value = '';
        }
    });
}

window.onload = function() {
    const storedUsername = localStorage.getItem('username');
    localStorage.setItem('elo', data.elo); // Save Elo in local storage

    if (storedUsername) {
        window.location.href = '/chess.html';
    }
};
