socket.on('connect', function() {
    var username = localStorage.getItem('username');
    var team     = localStorage.getItem('team');
    var isGuest  = localStorage.getItem('isGuest') === 'true';
    if (!gameId || !username) return;
    socket.emit('join game', { gameId: gameId, username: username });
    if (team && !isGuest) {
        userTeam = team;
        socket.emit('team selected', { team: team, username: username, gameId: gameId });
    }
});

socket.on('init', function(state) {
    game.load(state.game);
    board.position(state.game);

    var messagesEl = document.getElementById('messages');
    if (messagesEl) messagesEl.innerHTML = '';
    state.chat.forEach(function(msg) {
        var parts    = msg.split(':');
        var userSpan = $('<span>').addClass('username').text(parts[0] + ': ');
        var textSpan = $('<span>').text(parts.slice(1).join(':').trim());
        $('#messages').append($('<li>').append(userSpan, textSpan));
    });
    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;

    var nameEl = document.getElementById('game-name');
    if (nameEl) nameEl.textContent = state.gameName || '';

    userTeam = localStorage.getItem('team');
    displayMovesHistory(state.movesHistory);
});

socket.on('teams update', function(teams) {
    var whiteBtn   = document.getElementById('white-team-btn');
    var blackBtn   = document.getElementById('black-team-btn');
    var restartBtn = document.getElementById('restart-btn');
    var twoPlayers = document.getElementById('two-players');
    var username   = localStorage.getItem('username');

    if (teams['w']) {
        whiteTeamPlayer = teams['w'];
        if (whiteBtn) { whiteBtn.style.opacity = '0.6'; whiteBtn.style.pointerEvents = 'none'; }
        if (username === teams['w']) userTeam = 'w';
    } else {
        if (whiteBtn) { whiteBtn.style.opacity = '1'; whiteBtn.style.pointerEvents = 'auto'; }
    }

    if (teams['b']) {
        blackTeamPlayer = teams['b'];
        if (blackBtn) { blackBtn.style.opacity = '0.6'; blackBtn.style.pointerEvents = 'none'; }
        if (username === teams['b']) userTeam = 'b';
    } else {
        if (blackBtn) { blackBtn.style.opacity = '1'; blackBtn.style.pointerEvents = 'auto'; }
    }

    if (restartBtn) restartBtn.style.display = userTeam ? 'flex' : 'none';
    if (twoPlayers) twoPlayers.style.display = (teams['w'] && teams['b']) ? 'block' : 'none';

    if (teams['w']) localStorage.setItem('whiteTeamPlayer', teams['w']);
    else localStorage.removeItem('whiteTeamPlayer');
    if (teams['b']) localStorage.setItem('blackTeamPlayer', teams['b']);
    else localStorage.removeItem('blackTeamPlayer');

    updateStatus();
});

socket.on('move', function(fen) {
    game.load(fen);
    board.position(game.fen());
    if (!userTeam || userTeam === 'w') board.orientation('white');
    else board.orientation('black');
    updateStatus();
    isKingInCheck();
});

socket.on('updateHistory', function(history) {
    displayMovesHistory(history);
});

socket.on('move sound', function() {
    playSound(moveSound);
});

socket.on('update elo', function(data) {
    if (localStorage.getItem('username') === data.username) {
        var el = document.getElementById('elo');
        if (el) el.textContent = data.elo;
        localStorage.setItem('elo', data.elo);
    }
});

socket.on('game result', function(data) {
    swal({ title: data.message, buttons: { confirm: { text: 'OK', value: true, visible: true, closeModal: true } } });
    if (data.message.startsWith('You won')) { playSound(winSound); realisticConfetti(); }
    else if (data.message.startsWith('You lost')) { playSound(loseSound); }
    else if (data.message.startsWith('Game')) { playSound(equalitySound); }
    var tp = document.getElementById('two-players');
    if (tp) tp.style.display = 'none';
});

socket.on('game not found', function() {
    window.location.href = '/lobby';
});

socket.on('game start', function(data) {
    game.load(data.fen);
    board.position(game.fen());
    updateStatus();
    isKingInCheck();
});

socket.on('restart', function() {
    game = new Chess();
    board.position(game.fen());
    board.orientation('white');
    updateStatus();

    whiteTeamPlayer = null;
    blackTeamPlayer = null;
    userTeam        = null;

    winSound.pause();
    loseSound.pause();

    localStorage.removeItem('whiteTeamPlayer');
    localStorage.removeItem('blackTeamPlayer');
    localStorage.removeItem('team');

    var wb = document.getElementById('white-team-btn');
    var bb = document.getElementById('black-team-btn');
    var rb = document.getElementById('restart-btn');
    var tp = document.getElementById('two-players');

    if (wb) { wb.style.opacity = '1'; wb.style.pointerEvents = 'auto'; }
    if (bb) { bb.style.opacity = '1'; bb.style.pointerEvents = 'auto'; }
    if (rb) { rb.style.display = 'none'; rb.style.opacity = '1'; rb.style.pointerEvents = 'auto'; }
    if (tp) tp.style.display = 'none';

    var mh = document.getElementById('movesHistory');
    if (mh) mh.innerHTML = '';
});

socket.on('promptRestart', function(msg) {
    swal({
        title: msg.username + ' wants to restart. Accept?',
        buttons: { cancel: 'No', confirm: { text: 'Yes', value: true, visible: true } }
    }).then(function(val) {
        if (val) socket.emit('responseRestart', { username: msg.username, gameId: gameId });
    });
});

socket.on('responseRestart', function(msg) {
    if (msg.username) {
        socket.emit('restart', { gameId: gameId });
    } else {
        swal({ title: 'Restart declined.', buttons: { confirm: { text: 'OK', value: true, visible: true } } });
        var btn = document.getElementById('restart-btn');
        if (btn) { btn.style.opacity = '1'; btn.style.pointerEvents = 'auto'; }
    }
});

