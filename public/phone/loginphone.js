document.getElementById("login-form").addEventListener("submit", function(event){
    event.preventDefault();
    logIn(event);
});

document.getElementById("register-form").addEventListener("submit", function(event){
    event.preventDefault();
    register(event);
});

function shakeElement(element) {
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 820);
}

function addFadeInAnimation(element) {
    element.classList.add('fade-in');
    element.addEventListener('animationend', () => {
        element.classList.remove('fade-in');
    });
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
                shakeElement(usernameInput);
                passwordInput.style.borderColor = 'red';
                shakeElement(passwordInput);
            } else if (data.message === 'User not found') {
                usernameInput.style.borderColor = 'red';
                shakeElement(usernameInput);
                passwordInput.style.borderColor = '';
            }
        } else {
            localStorage.setItem('username', data.username); // Save username in local storage
            localStorage.setItem('elo', data.elo); // Save Elo in local storage
            window.location.href = '/chessPhone.html';  // Redirect to the chess page
            usernameInput.style.borderColor = '';
            passwordInput.style.borderColor = '';
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
            shakeElement(usernameInput);
            passwordInput.style.borderColor = '';
        } else {
            usernameInput.style.borderColor = '';
            passwordInput.value = '';
            usernameInput.value = '';
            document.querySelector(".sign-up-container").style.display = "none";
            document.querySelector(".sign-in-container").style.display = "block";
        }
    });
}

window.onload = function() {
    const storedUsername = localStorage.getItem('username');
    const storedElo = localStorage.getItem('elo');

    if (storedUsername && storedElo) {
        window.location.href = '../chessPhone.html';
    }
};

document.querySelector(".sign-in-container p").addEventListener("click", function() {
    document.querySelector(".sign-in-container").style.display = "none";
    document.querySelector(".sign-up-container").style.display = "block";
    addFadeInAnimation(document.querySelector(".sign-up-container"));
});

document.querySelector(".sign-up-container p").addEventListener("click", function() {
    document.querySelector(".sign-up-container").style.display = "none";
    document.querySelector(".sign-in-container").style.display = "block";
    addFadeInAnimation(document.querySelector(".sign-in-container"));
});