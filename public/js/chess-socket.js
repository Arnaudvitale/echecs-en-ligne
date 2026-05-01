/* =============================================================
   Chess App — Socket.io Events
   ============================================================= */

/* Rejoindre la partie à chaque (re)connexion */
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

/* État initial à la connexion */
socket.on('init', function(state) {
    game.load(state.game);
    board.position(state.game);

    /* Chat history */
    var messagesEl = document.getElementById('messages');
    if (messagesEl) messagesEl.innerHTML = '';
    state.chat.forEach(function(msg) {
        var parts    = msg.split(':');
        var userSpan = $('<span>').addClass('username').text(parts[0] + ': ');
        var textSpan = $('<span>').text(parts.slice(1).join(':').trim());
        $('#messages').append($('<li>').append(userSpan, textSpan));
    });
    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;

    /* Game name */
    var nameEl = document.getElementById('game-name');
    if (nameEl) nameEl.textContent = state.gameName || '';

    userTeam = localStorage.getItem('team');
    displayMovesHistory(state.movesHistory);
});

/* Mise à jour des équipes */
socket.on('teams update', function(teams) {
    var whiteBtn   = document.getElementById('white-team-btn');
    var blackBtn   = document.getElementById('black-team-btn');
    var restartBtn = document.getElementById('restart-btn');
    var twoPlayers = document.getElementById('two-players');

    if (teams['w']) {
        whiteTeamPlayer             = teams['w'];
        if (whiteBtn) { whiteBtn.style.opacity = '0.6'; whiteBtn.style.pointerEvents = 'none'; }
        if (localStorage.getItem('username') === teams['w']) userTeam = 'w';
    } else {
        if (whiteBtn) { whiteBtn.style.opacity = '1'; whiteBtn.style.pointerEvents = 'auto'; }
    }

    if (teams['b']) {
        blackTeamPlayer             = teams['b'];
        if (blackBtn) { blackBtn.style.opacity = '0.6'; blackBtn.style.pointerEvents = 'none'; }
        if (localStorage.getItem('username') === teams['b']) userTeam = 'b';
    } else {
        if (blackBtn) { blackBtn.style.opacity = '1'; blackBtn.style.pointerEvents = 'auto'; }
    }

    if (restartBtn) restartBtn.style.display = userTeam ? 'flex' : 'none';
    if (twoPlayers && teams['w'] && teams['b']) twoPlayers.style.display = 'block';

    if (localStorage.getItem('username') === 'arnaud') {
        if (restartBtn) restartBtn.style.visibility = 'visible';
        if (twoPlayers) twoPlayers.style.display = 'none';
    }

    if (teams['w']) localStorage.setItem('whiteTeamPlayer', teams['w']);
    else localStorage.removeItem('whiteTeamPlayer');
    if (teams['b']) localStorage.setItem('blackTeamPlayer', teams['b']);
    else localStorage.removeItem('blackTeamPlayer');

    updateStatus();
});

/* Coup joué */
socket.on('move', function(fen) {
    game.load(fen);
    board.position(game.fen());
    if (!userTeam || userTeam === 'w') board.orientation('white');
    else board.orientation('black');
    updateStatus();
    isKingInCheck();
});

/* Historique */
socket.on('updateHistory', function(history) {
    displayMovesHistory(history);
});

/* Son */
socket.on('move sound', function() {
    playSound(moveSound);
});

/* ELO */
socket.on('update elo', function(data) {
    if (localStorage.getItem('username') === data.username) {
        var el = document.getElementById('elo');
        if (el) el.textContent = data.elo;
        localStorage.setItem('elo', data.elo);
    }
});

/* Résultat */
socket.on('game result', function(data) {
    swal({ title: data.message, buttons: { confirm: { text: 'OK', value: true, visible: true, closeModal: true } } });
    if (data.message.startsWith('You won')) { playSound(winSound); realisticConfetti(); }
    else if (data.message.startsWith('You lost')) { playSound(loseSound); }
    else if (data.message.startsWith('Game')) { playSound(equalitySound); }
    var tp = document.getElementById('two-players');
    if (tp) tp.style.display = 'none';
});

/* Partie non trouvée */
socket.on('game not found', function() {
    window.location.href = '/lobby';
});

/* Reset */
socket.on('restart', function(fen) {
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
    if (rb) { rb.style.opacity = '1'; rb.style.pointerEvents = 'auto'; rb.style.visibility = 'hidden'; }
    if (tp) tp.style.display = 'none';

    var mh = document.getElementById('movesHistory');
    if (mh) mh.innerHTML = '';
});

/* Demande restart adverse */
socket.on('promptRestart', function(msg) {
    swal({
        title: msg.username + ' wants to restart. Accept?',
        buttons: { cancel: 'No', confirm: { text: 'Yes', value: true, visible: true } }
    }).then(function(val) {
        if (val) socket.emit('responseRestart', { username: msg.username, gameId: gameId });
    });
});

/* Réponse restart */
socket.on('responseRestart', function(msg) {
    if (msg.username) {
        socket.emit('restart', { fen: game.fen(), gameId: gameId });
    } else {
        swal({ title: 'Restart declined.', buttons: { confirm: { text: 'OK', value: true, visible: true } } });
    }
});


/* État initial à la connexion */
socket.on('init', function(state) {
    game.load(state.game);
    board.position(state.game);

    state.chat.forEach(function(msg) {
        var parts    = msg.split(':');
        var userSpan = $('<span>').addClass('username').text(parts[0] + ': ');
        var textSpan = $('<span>').text(parts.slice(1).join(':').trim());
        $('#messages').append($('<li>').append(userSpan, textSpan).css('text-align', 'left'));
    });
    var messagesEl = document.getElementById('messages');
    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;

    userTeam = localStorage.getItem('team');
    displayMovesHistory(state.movesHistory);
});

/* Mise à jour des équipes */
socket.on('teams update', function(teams) {
    var whiteBtn  = document.getElementById('white-team-btn');
    var blackBtn  = document.getElementById('black-team-btn');
    var restartBtn = document.getElementById('restart-btn');
    var twoPlayers = document.getElementById('two-players');

    if (teams['w']) {
        whiteTeamPlayer             = teams['w'];
        whiteBtn.style.opacity       = '0.6';
        whiteBtn.style.pointerEvents = 'none';
        if (localStorage.getItem('username') === teams['w']) userTeam = 'w';
    } else {
        whiteBtn.style.opacity       = '1';
        whiteBtn.style.pointerEvents = 'auto';
    }

    if (teams['b']) {
        blackTeamPlayer             = teams['b'];
        blackBtn.style.opacity       = '0.6';
        blackBtn.style.pointerEvents = 'none';
        if (localStorage.getItem('username') === teams['b']) userTeam = 'b';
    } else {
        blackBtn.style.opacity       = '1';
        blackBtn.style.pointerEvents = 'auto';
    }

    if (restartBtn) {
        restartBtn.style.visibility = userTeam ? 'visible' : 'hidden';
    }
    if (twoPlayers && teams['w'] && teams['b']) {
        twoPlayers.style.display = 'block';
    }

    /* Admin arnaud peut toujours redémarrer */
    if (localStorage.getItem('username') === 'arnaud') {
        if (restartBtn) restartBtn.style.visibility = 'visible';
        if (twoPlayers) twoPlayers.style.display    = 'none';
    }

    if (teams['w']) {
        localStorage.setItem('whiteTeamPlayer', teams['w']);
    } else {
        localStorage.removeItem('whiteTeamPlayer');
    }
    if (teams['b']) {
        localStorage.setItem('blackTeamPlayer', teams['b']);
    } else {
        localStorage.removeItem('blackTeamPlayer');
    }

    updateStatus();
});

/* Confirmation locale de sélection d'équipe */
socket.on('team selected', function(data) {
    var team     = data.team;
    var username = data.username;
    if (team === 'w') {
        whiteTeamPlayer = username;
        document.getElementById('white-team-btn').style.opacity       = '0.6';
        document.getElementById('white-team-btn').style.pointerEvents = 'none';
        if (username === localStorage.getItem('username')) userTeam = team;
    } else if (team === 'b') {
        blackTeamPlayer = username;
        document.getElementById('black-team-btn').style.opacity       = '0.6';
        document.getElementById('black-team-btn').style.pointerEvents = 'none';
        if (username === localStorage.getItem('username')) userTeam = team;
    }
    updateStatus();
});

/* Coup joué par l'adversaire */
socket.on('move', function(fen) {
    game.load(fen);
    board.position(game.fen());
    if (!userTeam || userTeam === 'w') {
        board.orientation('white');
    } else {
        board.orientation('black');
    }
    updateStatus();
    isKingInCheck();
});

/* Historique des coups */
socket.on('updateHistory', function(history) {
    displayMovesHistory(history);
});

/* Son de déplacement */
socket.on('move sound', function() {
    playSound(moveSound);
});

/* Mise à jour ELO */
socket.on('update elo', function(data) {
    if (localStorage.getItem('username') === data.username) {
        var el = document.getElementById('elo');
        if (el) el.textContent = data.elo;
        localStorage.setItem('elo', data.elo);
    }
});

/* Résultat de la partie */
socket.on('game result', function(data) {
    swal({
        title: data.message,
        buttons: { confirm: { text: 'OK', value: true, visible: true, closeModal: true } }
    });
    var twoPlayers = document.getElementById('two-players');
    if (data.message.startsWith('Wow')) {
        playSound(winSound);
        realisticConfetti();
    } else if (data.message.startsWith('You')) {
        playSound(loseSound);
    } else if (data.message.startsWith('Game')) {
        playSound(equalitySound);
    }
    if (twoPlayers) twoPlayers.style.display = 'none';
});

/* Reset de la partie */
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

    document.getElementById('white-team-btn').style.opacity       = '1';
    document.getElementById('white-team-btn').style.pointerEvents = 'none';
    document.getElementById('black-team-btn').style.opacity       = '1';
    document.getElementById('black-team-btn').style.pointerEvents = 'none';

    var restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.style.opacity       = '1';
        restartBtn.style.pointerEvents = 'auto';
    }

    var movesHistoryEl = document.getElementById('movesHistory');
    if (movesHistoryEl) movesHistoryEl.innerHTML = '';

    var twoPlayers = document.getElementById('two-players');
    if (twoPlayers) twoPlayers.style.display = 'none';

    socket.emit('team selected', { team: 'w', username: null });
    socket.emit('team selected', { team: 'b', username: null });
    socket.emit('init');
});

/* Demande de redémarrage de l'adversaire */
socket.on('promptRestart', function(msg) {
    swal({
        title: msg.username + ' wants to restart the game. Do you accept?',
        buttons: {
            cancel:  { text: 'No',  value: false, visible: true, closeModal: true },
            confirm: { text: 'Yes', value: true,  visible: true, closeModal: true }
        }
    }).then(function(value) {
        if (value) {
            socket.emit('restart', game.fen());
        } else {
            socket.emit('responseRestart', { username: msg.username });
        }
    });
});

/* Refus de redémarrage */
socket.on('responseRestart', function(msg) {
    swal({
        title: msg.username + ' refused to restart the game.',
        buttons: { confirm: { text: 'OK', value: true, visible: true, closeModal: true } }
    }).then(function() {
        var btn = document.getElementById('restart-btn');
        if (btn) {
            btn.style.opacity       = '1';
            btn.style.pointerEvents = 'auto';
        }
    });
});
