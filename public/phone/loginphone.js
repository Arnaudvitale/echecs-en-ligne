// Tab switching
var tabs = document.querySelectorAll('.tab');
var panels = {
    'sign-in': document.getElementById('sign-in'),
    'sign-up': document.getElementById('sign-up')
};

tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
        tabs.forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var target = tab.getAttribute('data-target');
        Object.keys(panels).forEach(function(k) {
            panels[k].style.display = k === target ? 'block' : 'none';
        });
        var active = panels[target];
        active.style.animation = 'none';
        void active.offsetWidth;
        active.style.animation = 'fade-in 0.25s ease forwards';
    });
});

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
            tabs[0].click();
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
    window.location.href = '/devPage.html';
});


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

document.querySelector(".dev").addEventListener("click", function() {
    window.location.href = '../devPage.html';
});