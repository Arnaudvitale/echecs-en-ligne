const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
	container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
	container.classList.remove("right-panel-active");
});

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
                console.log(data.message);
            } else if (data.message === 'User not found') {
                usernameInput.style.borderColor = 'red';
                shakeElement(usernameInput);
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
            shakeElement(usernameInput);
        } else {
            usernameInput.style.borderColor = '';
            passwordInput.value = '';
            usernameInput.value = '';
            container.classList.remove("right-panel-active");
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

// Function to toggle password visibility
function togglePasswordVisibility(event) {
    const img = event.target;
    const input = img.previousElementSibling;

    if (input.type === 'password') {
        input.type = 'text';
        img.src = '../img/pwd/eye.png';
    } else {
        input.type = 'password';
        img.src = '../img/pwd/closedeye.png';
    }
}

// add event listeners to all toggle password visibility images
document.querySelectorAll('.toggle-password-visibility').forEach(img => {
    img.addEventListener('click', togglePasswordVisibility);
});
