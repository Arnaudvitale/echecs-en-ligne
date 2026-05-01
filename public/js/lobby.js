/* ================================================================
   Lobby — Client Logic
   ================================================================ */

var socket = io();

function isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function renderGames(games) {
    var list   = document.getElementById('games-list');
    var noGame = document.getElementById('no-games');
    list.innerHTML = '';

    if (!games || games.length === 0) {
        noGame.style.display = 'block';
        return;
    }
    noGame.style.display = 'none';

    games.forEach(function(g) {
        var card = document.createElement('div');
        card.className = 'game-card';

        var wName = g.white ? '<span class="slot-taken">' + g.white + '</span>' : '<span class="slot-open">Open</span>';
        var bName = g.black ? '<span class="slot-taken">' + g.black + '</span>' : '<span class="slot-open">Open</span>';

        var count  = (g.white ? 1 : 0) + (g.black ? 1 : 0);
        var badgeClass = count === 2 ? 'badge-full' : count === 1 ? 'badge-half' : 'badge-empty';
        var badgeLabel = count === 2 ? '2/2 Full' : count + '/2';

        var statusClass = g.inProgress ? 'status-playing' : 'status-waiting';
        var statusLabel = g.inProgress ? 'En cours' : 'En attente';

        card.innerHTML =
            '<div class="game-card-header">' +
                '<div class="game-card-name">' + g.name + '</div>' +
                '<span class="player-badge ' + badgeClass + '">' + badgeLabel + '</span>' +
            '</div>' +
            '<div class="game-status ' + statusClass + '">' + statusLabel + '</div>' +
            '<div class="game-card-players">' +
                '<div class="player-slot"><i class="fa-solid fa-chess-king" style="color:#6366f1"></i> White: ' + wName + '</div>' +
                '<div class="player-slot"><i class="fa-solid fa-chess-king" style="color:#0f172a"></i> Black: ' + bName + '</div>' +
            '</div>' +
            '<div class="game-card-actions">' +
                '<button class="btn-enter"><i class="fas fa-arrow-right"></i> Enter</button>' +
            '</div>';

        card.querySelector('.btn-enter').addEventListener('click', function() {
            var path = isMobile() ? '/game' : '/chess';
            window.location.href = path + '?id=' + g.id;
        });

        list.appendChild(card);
    });
}

socket.on('connect', function() {
    socket.emit('get lobby');
});

socket.on('lobby state', renderGames);
socket.on('lobby update', renderGames);

socket.on('game created', function(data) {
    var path = isMobile() ? '/game' : '/chess';
    window.location.href = path + '?id=' + data.id;
});

document.getElementById('create-game-btn').addEventListener('click', function() {
    var username = localStorage.getItem('username');
    if (!username) return;
    var name = (prompt('Name your game (leave blank for default):') || '').trim();
    socket.emit('create game', { name: name || null, username: username });
});

document.getElementById('logout-btn').addEventListener('click', function() {
    fetch('/logout', { method: 'GET' }).then(function() {
        ['username', 'elo', 'team', 'whiteTeamPlayer', 'blackTeamPlayer', 'isGuest'].forEach(function(k) {
            localStorage.removeItem(k);
        });
        window.location.href = '/index.html';
    });
});

window.onload = function() {
    var username = localStorage.getItem('username');
    var isGuest  = localStorage.getItem('isGuest') === 'true';

    if (!username) { window.location.href = '/index.html'; return; }

    document.getElementById('username').textContent = username;

    if (isGuest) {
        document.getElementById('elo-display').style.display = 'none';
        var createBtn = document.getElementById('create-game-btn');
        createBtn.disabled = true;
        createBtn.title    = 'Login to create a game';
        document.getElementById('no-games-hint').textContent = 'Games will appear here once created.';
    } else {
        var elo = localStorage.getItem('elo') || '—';
        document.getElementById('elo').textContent = elo;
    }
};
