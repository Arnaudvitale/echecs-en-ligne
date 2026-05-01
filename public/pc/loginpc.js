function switchToSignIn() {
    document.getElementById('signin-panel').style.display = 'flex';
    document.getElementById('signup-panel').style.display = 'none';
    document.getElementById('tab-signin-btn').classList.add('active');
    document.getElementById('tab-signup-btn').classList.remove('active');
}

function switchToSignUp() {
    document.getElementById('signin-panel').style.display = 'none';
    document.getElementById('signup-panel').style.display = 'flex';
    document.getElementById('tab-signup-btn').classList.add('active');
    document.getElementById('tab-signin-btn').classList.remove('active');
}

document.getElementById('tab-signin-btn').addEventListener('click', switchToSignIn);
document.getElementById('tab-signup-btn').addEventListener('click', switchToSignUp);

document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    logIn();
});

document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    register();
});

function shakeElement(el) {
    el.classList.add('shake');
    setTimeout(function() { el.classList.remove('shake'); }, 500);
}

function setError(input, hasError) {
    input.classList.toggle('error', hasError);
    if (!hasError) input.style.borderColor = '';
}

function logIn() {
    var usernameInput = document.getElementById('username');
    var passwordInput = document.getElementById('password');
    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.value, password: passwordInput.value })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.status === 'error') {
            if (data.message === 'Incorrect username or password') {
                setError(usernameInput, true); shakeElement(usernameInput);
                setError(passwordInput, true); shakeElement(passwordInput);
            } else {
                setError(usernameInput, true); shakeElement(usernameInput);
                setError(passwordInput, false);
            }
        } else {
            localStorage.setItem('username', data.username);
            localStorage.setItem('elo', data.elo);
            window.location.href = '/lobby';
        }
    });
}

function register() {
    var usernameInput = document.getElementById('reg-username');
    var passwordInput = document.getElementById('reg-password');
    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.value, password: passwordInput.value })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.status === 'error') {
            setError(usernameInput, true);
            shakeElement(usernameInput);
            setError(passwordInput, false);
        } else {
            setError(usernameInput, false);
            usernameInput.value = '';
            passwordInput.value = '';
            switchToSignIn();
        }
    });
}

window.onload = function() {
    if (localStorage.getItem('username') && (localStorage.getItem('elo') || localStorage.getItem('isGuest') === 'true')) {
        window.location.href = '/lobby';
    }
    document.getElementById('guest-btn').addEventListener('click', function() {
        localStorage.setItem('isGuest', 'true');
        localStorage.setItem('username', 'Guest_' + Math.random().toString(36).substr(2, 6).toUpperCase());
        window.location.href = '/lobby';
    });
};

document.querySelectorAll('.toggle-pwd').forEach(function(btn) {
    btn.addEventListener('click', function() {
        var input = this.previousElementSibling;
        var icon = this.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye-slash';
        }
    });
});

document.getElementById('dev-link').addEventListener('click', function() {
    window.location.href = '/about';
});
