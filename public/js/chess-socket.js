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
    userTeam = localStorage.getItem('team');

    if (board) { board.position(state.game); }

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

    displayMovesHistory(state.movesHistory);

    if (state.timer && state.timer.enabled) {
        timerEnabled = true;
        updateTimers({ w: state.timer.w, b: state.timer.b, active: state.timer.active });
    }
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

    // Si l'utilisateur a déjà une équipe, griser les deux boutons
    if (userTeam) {
        if (whiteBtn) { whiteBtn.style.opacity = '0.6'; whiteBtn.style.pointerEvents = 'none'; }
        if (blackBtn) { blackBtn.style.opacity = '0.6'; blackBtn.style.pointerEvents = 'none'; }
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
    exitPreview(); // quitter la prévisualisation quand un nouveau coup arrive
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
    var msgMap = {
        'You won! Well played.':            'you-won',
        'You lost. Better luck next time.': 'you-lost',
        'Game ended in a draw!':            'draw'
    };
    var key = msgMap[data.message];
    var displayed = key ? t(key) : data.message;
    if (data.eloDelta != null) {
        displayed += ' (' + (data.eloDelta >= 0 ? '+' : '') + data.eloDelta + ' Elo)';
    }
    swal({ title: displayed, buttons: { confirm: { text: 'OK', value: true, visible: true, closeModal: true } } });
    if (data.message.startsWith('You won')) { playSound(winSound); realisticConfetti(); }
    else if (data.message.startsWith('You lost')) { playSound(loseSound); }
    else if (data.message.startsWith('Game')) { playSound(equalitySound); }
    var tp = document.getElementById('two-players');
    if (tp) tp.style.display = 'none';
    // Stop timer highlight
    ['w', 'b'].forEach(function(c) {
        var box = document.getElementById('timer-' + c);
        if (box) { box.classList.remove('timer-active'); box.classList.remove('timer-low'); }
    });
});

socket.on('game not found', function() {
    window.location.href = '/lobby';
});

socket.on('timer update', function(data) {
    updateTimers(data);
});

socket.on('game start', function(data) {
    game.load(data.fen);
    board.position(game.fen());
    if (userTeam === 'b') board.orientation('black');
    else board.orientation('white');
    updateStatus();
    isKingInCheck();
    if (data.timer && data.timer.enabled) {
        timerEnabled = true;
        updateTimers({ w: data.timer.w, b: data.timer.b, active: null });
    }
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

    // Hide timers on restart
    var tr = document.getElementById('timers-row');
    if (tr) tr.style.display = 'none';
    ['w', 'b'].forEach(function(c) {
        var el = document.getElementById('timer-' + c + '-time');
        if (el) el.textContent = '—:——';
        var box = document.getElementById('timer-' + c);
        if (box) { box.classList.remove('timer-active'); box.classList.remove('timer-low'); }
    });
});

socket.on('promptRestart', function(msg) {
    swal({
        title: msg.username + t('wants-restart'),
        buttons: { cancel: t('no'), confirm: { text: t('yes'), value: true, visible: true } }
    }).then(function(val) {
        if (val) socket.emit('responseRestart', { username: msg.username, gameId: gameId });
    });
});

socket.on('responseRestart', function(msg) {
    if (msg.username) {
        socket.emit('restart', { gameId: gameId });
    } else {
        swal({ title: t('restart-declined'), buttons: { confirm: { text: 'OK', value: true, visible: true } } });
        var btn = document.getElementById('restart-btn');
        if (btn) { btn.style.opacity = '1'; btn.style.pointerEvents = 'auto'; }
    }
});

socket.on('opponent disconnected', function(data) {
    swal({
        title: data.username + t('opponent-left'),
        text: t('disconnected-choose'),
        buttons: {
            cancel: { text: t('forfeit'), value: 'forfeit', visible: true },
            confirm: { text: t('restart'), value: 'restart', visible: true }
        }
    }).then(function(val) {
        if (val === 'restart') {
            socket.emit('restart', { gameId: gameId });
        } else {
            var username = localStorage.getItem('username');
            socket.emit('end game', { winner: username, loser: data.username, gameId: gameId });
        }
    });
});

