/* =============================================================
   Chess App — Initialisation & Event Listeners DOM
   ============================================================= */

var isGuest = localStorage.getItem('isGuest') === 'true';

/* --- Sélection d'équipe --- */
document.getElementById('white-team-btn').addEventListener('click', function() {
    if (isGuest) return;
    if (userTeam) return;
    userTeam = 'w';
    this.style.opacity       = '0.6';
    this.style.pointerEvents = 'none';
    document.getElementById('black-team-btn').style.pointerEvents = 'none';
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
    document.getElementById('white-team-btn').style.pointerEvents = 'none';
    localStorage.setItem('team', 'b');
    socket.emit('team selected', { team: 'b', username: localStorage.getItem('username'), gameId: gameId });
    board.orientation('black');
});

/* --- Déconnexion --- */
document.getElementById('logout-btn').addEventListener('click', function() {
    fetch('/logout', { method: 'GET' }).then(function() {
        ['username', 'whiteTeamPlayer', 'blackTeamPlayer', 'team', 'elo', 'isGuest'].forEach(function(k) {
            localStorage.removeItem(k);
        });
        window.location.href = '/index.html';
    });
});

/* --- Bouton Lobby --- */
var lobbyBtn = document.getElementById('lobby-btn');
if (lobbyBtn) {
    lobbyBtn.addEventListener('click', function() {
        localStorage.removeItem('team');
        window.location.href = '/lobby';
    });
}

/* --- Bouton Restart --- */
document.getElementById('restart-btn').addEventListener('click', function() {
    var noOpponent = !localStorage.getItem('blackTeamPlayer') || !localStorage.getItem('whiteTeamPlayer');
    if (noOpponent || game.game_over() || localStorage.getItem('username') === 'arnaud') {
        socket.emit('restart', { fen: game.fen(), gameId: gameId });
    } else {
        socket.emit('requestRestart', { username: localStorage.getItem('username'), gameId: gameId });
        this.style.opacity       = '0.6';
        this.style.pointerEvents = 'none';
    }
});

/* --- Nettoyage avant fermeture --- */
window.addEventListener('beforeunload', function() {
    var username = localStorage.getItem('username');
    if (localStorage.getItem('whiteTeamPlayer') === username) localStorage.removeItem('whiteTeamPlayer');
    else if (localStorage.getItem('blackTeamPlayer') === username) localStorage.removeItem('blackTeamPlayer');
    localStorage.removeItem('team');
});

/* --- Vérification auth au chargement --- */
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

    /* Invité : ne peut pas jouer */
    if (isGuest) {
        var wb = document.getElementById('white-team-btn');
        var bb = document.getElementById('black-team-btn');
        if (wb) { wb.disabled = true; wb.title = 'Login to play'; wb.style.opacity = '0.4'; }
        if (bb) { bb.disabled = true; bb.title = 'Login to play'; bb.style.opacity = '0.4'; }
    }

    if (localStorage.getItem('username') === 'arnaud') {
        var rb = document.getElementById('restart-btn');
        if (rb) rb.style.display = 'flex';
    }
};
