/* ================================================================
   Lobby — Client Logic
   ================================================================ */

var socket = io();
var lastGames = [];

function isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function renderGames(games) {
    lastGames = games || [];
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

        var wName = g.white ? '<span class="slot-taken">' + g.white + '</span>' : '<span class="slot-open">' + t('slot-open') + '</span>';
        var bName = g.black ? '<span class="slot-taken">' + g.black + '</span>' : '<span class="slot-open">' + t('slot-open') + '</span>';

        var count  = (g.white ? 1 : 0) + (g.black ? 1 : 0);
        var badgeClass = count === 2 ? 'badge-full' : count === 1 ? 'badge-half' : 'badge-empty';
        var badgeLabel = count === 2 ? '2/2 Full' : count + '/2';

        var statusClass = g.inProgress ? 'status-playing' : 'status-waiting';
        var statusLabel = g.inProgress ? t('status-playing') : t('status-waiting');

        var timerBadge = g.timer > 0
            ? ' <span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:700;color:#6366f1;background:rgba(99,102,241,0.1);border-radius:4px;padding:1px 6px;margin-left:6px;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 2h6"/><path d="M12 2v3"/></svg>' + (g.timer < 60 ? g.timer + 's' : Math.floor(g.timer / 60) + ' min') + '</span>'
            : '';

        card.innerHTML =
            '<div class="game-card-header">' +
                '<div class="game-card-name">' + g.name + timerBadge + '</div>' +
                '<span class="player-badge ' + badgeClass + '">' + badgeLabel + '</span>' +
            '</div>' +
            '<div class="game-status ' + statusClass + '">' + statusLabel + '</div>' +
            '<div class="game-card-players">' +
                '<div class="player-slot"><i class="fa-solid fa-chess-king" style="color:#6366f1"></i> ' + t('white') + ': ' + wName + '</div>' +
                '<div class="player-slot"><i class="fa-solid fa-chess-king" style="color:#0f172a"></i> ' + t('black') + ': ' + bName + '</div>' +
            '</div>' +
            '<div class="game-card-actions">' +
                '<button class="btn-enter"><i class="fas fa-arrow-right"></i> ' + t('btn-enter') + '</button>' +
            '</div>';

        card.querySelector('.btn-enter').addEventListener('click', function() {
            var path = isMobile() ? '/game' : '/chess';
            window.location.href = path + '?id=' + g.id;
        });

        list.appendChild(card);
    });
}

function onLangChange() {
    renderGames(lastGames);
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

var createModal    = document.getElementById('create-modal');
var modalNameInput = document.getElementById('modal-game-name');

function openCreateModal() {
    modalNameInput.value = '';
    createModal.style.display = 'flex';
    setTimeout(function() { modalNameInput.focus(); }, 50);
}

function closeCreateModal() {
    createModal.style.display = 'none';
}

function submitCreate() {
    var username = localStorage.getItem('username');
    if (!username) return;
    var name = modalNameInput.value.trim();
    var timerSeconds = parseInt(document.getElementById('modal-timer').value) || 0;
    socket.emit('create game', { name: name || null, username: username, timerSeconds: timerSeconds });
    closeCreateModal();
}

document.getElementById('modal-cancel').addEventListener('click', closeCreateModal);
document.getElementById('modal-create').addEventListener('click', submitCreate);
modalNameInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') submitCreate();
    if (e.key === 'Escape') closeCreateModal();
});
createModal.addEventListener('click', function(e) {
    if (e.target === createModal) closeCreateModal();
});

document.getElementById('create-game-btn').addEventListener('click', function() {
    var username = localStorage.getItem('username');
    if (!username) return;
    openCreateModal();
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
        createBtn.title    = t('login-to-play');
        var hint = document.getElementById('no-games-hint');
        if (hint) {
            hint.setAttribute('data-i18n', 'no-games-hint-guest');
            hint.textContent = t('no-games-hint-guest');
        }
    } else {
        var elo = localStorage.getItem('elo') || '—';
        document.getElementById('elo').textContent = elo;
    }
};
