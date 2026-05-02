var isGuest = localStorage.getItem('isGuest') === 'true';

document.getElementById('white-team-btn').addEventListener('click', function() {
    if (isGuest) return;
    if (userTeam) return;
    userTeam = 'w';
    this.style.opacity       = '0.6';
    this.style.pointerEvents = 'none';
    var bb = document.getElementById('black-team-btn');
    bb.style.opacity       = '0.6';
    bb.style.pointerEvents = 'none';
    localStorage.setItem('team', 'w');
    socket.emit('team selected', { team: 'w', username: localStorage.getItem('username'), gameId: gameId });
    board.orientation('white');
});

document.getElementById('black-team-btn').addEventListener('click', function() {
    if (isGuest) return;
    if (userTeam) return;
    userTeam = 'b';
    this.style.opacity       = '0.6';
    this.style.pointerEvents = 'none';
    var wb = document.getElementById('white-team-btn');
    wb.style.opacity       = '0.6';
    wb.style.pointerEvents = 'none';
    localStorage.setItem('team', 'b');
    socket.emit('team selected', { team: 'b', username: localStorage.getItem('username'), gameId: gameId });
    board.orientation('black');
});

document.getElementById('logout-btn').addEventListener('click', function() {
    fetch('/logout', { method: 'GET' }).then(function() {
        ['username', 'whiteTeamPlayer', 'blackTeamPlayer', 'team', 'elo', 'isGuest'].forEach(function(k) {
            localStorage.removeItem(k);
        });
        window.location.href = '/index.html';
    });
});

var lobbyBtn = document.getElementById('lobby-btn');
if (lobbyBtn) {
    lobbyBtn.addEventListener('click', function() {
        localStorage.removeItem('team');
        window.location.href = '/lobby';
    });
}

document.getElementById('restart-btn').addEventListener('click', function() {
    var noOpponent = !localStorage.getItem('blackTeamPlayer') || !localStorage.getItem('whiteTeamPlayer');
    if (noOpponent || game.game_over() || localStorage.getItem('username') === 'arnaud') {
        socket.emit('restart', { gameId: gameId });
    } else {
        socket.emit('requestRestart', { username: localStorage.getItem('username'), gameId: gameId });
        this.style.opacity       = '0.6';
        this.style.pointerEvents = 'none';
    }
});

function onLangChange() {
    updateStatus();
    var mh = document.getElementById('movesHistory');
    if (mh) {
        var checkLi = mh.querySelector('.check-alert');
        if (checkLi && game.in_check()) {
            var colorKey = game.turn() === 'w' ? 'white' : 'black';
            var label    = t(colorKey);
            label        = label.charAt(0).toUpperCase() + label.slice(1);
            checkLi.textContent = label + ' \u2014 ' + t('king-check');
        }
        var goLi = mh.querySelector('.game-over-alert');
        if (goLi) goLi.textContent = t('game-over');
    }
}
// Quitter le mode prévisualisation spectateur en cliquant ailleurs
document.addEventListener('click', function(e) {
    if (!isPreviewMode) return;
    var container = document.getElementById('movesHistoryContainer');
    if (container && container.contains(e.target)) return;
    exitPreview();
});
window.addEventListener('beforeunload', function() {
    var username = localStorage.getItem('username');
    if (localStorage.getItem('whiteTeamPlayer') === username) localStorage.removeItem('whiteTeamPlayer');
    else if (localStorage.getItem('blackTeamPlayer') === username) localStorage.removeItem('blackTeamPlayer');
    localStorage.removeItem('team');
});

window.onload = function() {
    var username = localStorage.getItem('username');
    var elo      = localStorage.getItem('elo');

    if (!username) { window.location.href = '/index.html'; return; }
    if (!isGuest && !elo) { window.location.href = '/index.html'; return; }
    if (!gameId) { window.location.href = '/lobby'; return; }

    var usernameEl = document.getElementById('username');
    var eloEl      = document.getElementById('elo');
    if (usernameEl) usernameEl.textContent = username;
    if (eloEl)      eloEl.textContent = isGuest ? 'Guest' : elo;

    if (isGuest) {
        var wb = document.getElementById('white-team-btn');
        var bb = document.getElementById('black-team-btn');
        if (wb) { wb.disabled = true; wb.title = t('login-to-play'); wb.style.opacity = '0.4'; }
        if (bb) { bb.disabled = true; bb.title = t('login-to-play'); bb.style.opacity = '0.4'; }
    }

    if (localStorage.getItem('username') === 'arnaud') {
        var rb = document.getElementById('restart-btn');
        if (rb) rb.style.display = 'flex';
    }
};
