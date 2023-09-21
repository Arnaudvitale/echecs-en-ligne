const container = document.getElementById('container');
const paragraphs = document.querySelectorAll('p');

paragraph.addEventListener('click', () => {
    if (signInContainer.style.display === 'none') {
      signInContainer.style.display = 'inline';
      signUpContainer.style.display = 'none';
    } else {
      signInContainer.style.display = 'none';
      signUpContainer.style.display = 'inline';
    }
});

document.getElementById("login-form").addEventListener("submit", function(event){
    event.preventDefault();
    logIn(event);
});

document.getElementById("register-form").addEventListener("submit", function(event){
    event.preventDefault();
    register(event);
});

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
                console.log(data.message);
            } else if (data.message === 'User not found') {
                usernameInput.style.borderColor = 'red';
                passwordInput.style.borderColor = '';
                console.log(data.message);
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
            passwordInput.style.borderColor = '';
        } else {
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
        window.location.href = '../chess.html';
    }
};