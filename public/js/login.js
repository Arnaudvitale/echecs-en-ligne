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
    errorElement.style.visibility = 'visible';
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
            window.location.href = '/chess.html';  // Redirect to the chess page
            usernameInput.style.borderColor = '';
            passwordInput.style.borderColor = '';
            clearError(usernameInput);
            clearError(passwordInput);
        }
    });
}

function register(event) {
    event.preventDefault();

    const usernameInput = document.getElementById('reg-username');
    const passwordInput = document.getElementById('reg-password');
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
        } else {
            alert(`Registered ${username}`);
            usernameInput.style.borderColor = '';
            clearError(usernameInput);
        }
    });
}

window.onload = function() {
    const storedUsername = localStorage.getItem('username');

    if (storedUsername) {
        window.location.href = '/chess.html';
    }
};
