var socket = io();
var game = new Chess();
var moveSound = new Audio('../sound/move.mp3');
var whiteSquareGrey = '#a9a9a9';
var blackSquareGrey = '#696969';
var userTeam = null;
let whiteTeamPlayer = null;
let blackTeamPlayer = null;

// update the board position after the piece snap
var updateStatus = function() {
    var statusEl = $('#status');
    var moveColor = game.turn() === 'b' ? 'Black' : 'White';
    statusEl.text('Turn: ' + moveColor);
};

updateStatus();

function removeGreySquares() {
    $('#myBoard .square-55d63').css('background', '');
}

function greySquare(square) {
    var $square = $('#myBoard .square-' + square);
    var background = whiteSquareGrey;
    if ($square.hasClass('black-3c85d')) {
        background = blackSquareGrey;
    }
    $square.css('background', background);
}

document.getElementById('white-team-btn').addEventListener('click', function() {
    whiteTeamPlayer = localStorage.getItem('username');
    if (userTeam) return;
    userTeam = 'w';
    this.style.opacity = '0.6';
    this.style.pointerEvents = 'none';
    document.getElementById('black-team-btn').style.pointerEvents = 'none';
    localStorage.setItem('team', 'w');
    socket.emit('team selected', {team: 'w', username: localStorage.getItem('username')});
});

document.getElementById('black-team-btn').addEventListener('click', function() {
    blackTeamPlayer = localStorage.getItem('username');
    if (userTeam) return;
    userTeam = 'b';
    this.style.opacity = '0.6';
    this.style.pointerEvents = 'none';
    document.getElementById('white-team-btn').style.pointerEvents = 'none';
    localStorage.setItem('team', 'b');
    socket.emit('team selected', {team: 'b', username: localStorage.getItem('username')});
});

var board = Chessboard('myBoard', {
    position: 'start',
    draggable: true,
    pieceTheme: '../img/{piece}.png',
    onDragStart: function(source, piece) {
        if (game.game_over()) return false;
        if (!userTeam || (userTeam === 'w' && piece.search(/^b/) !== -1) || (userTeam === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
    },
    onDrop: function(source, target) {
        if (!userTeam) return 'snapback';
        removeGreySquares();
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });
        if (move === null) return 'snapback';
        updateStatus();
        socket.emit('move', game.fen());
        moveSound.play().catch(error => console.log('Error playing sound:', error));

        if (game.game_over()) {
            userTeam = null;
            let winner, loser;
            if (game.in_draw()) { // Draw
                winner = loser = null;
            } else if (game.turn() === 'w') { // Whites have lost
                winner = blackTeamPlayer;
                loser = whiteTeamPlayer;
            } else { // Blacks have lost
                winner = whiteTeamPlayer;
                loser = blackTeamPlayer;
            }
            socket.emit('end game', { winner: winner, loser: loser });
            // Here we emit the restart event with the 'start' argument which represents the initial position
            socket.emit('restart', 'start');
            whiteTeamPlayer = null;
            blackTeamPlayer = null;
            document.getElementById('white-team-btn').style.opacity = '1';
            document.getElementById('white-team-btn').style.pointerEvents = 'auto';
            document.getElementById('black-team-btn').style.opacity = '1';
            document.getElementById('black-team-btn').style.pointerEvents = 'auto';
        }
    },
    onMouseoutSquare: function(square, piece) {
        removeGreySquares();
    },
    onMouseoverSquare: function(square, piece) {
        if (!piece || !userTeam) return;
        var pieceColor = piece.charAt(0);
        if ((userTeam === 'w' && pieceColor === 'b') || (userTeam === 'b' && pieceColor === 'w')) {
            return;
        }
        var moves = game.moves({
            square: square,
            verbose: true
        });
        if (moves.length === 0) return;
        greySquare(square);
        for (var i = 0; i < moves.length; i++) {
            greySquare(moves[i].to);
        }
    },
    onSnapEnd: function() {
        board.position(game.fen());
    }
});

socket.on('init', function(state) {
    game.load(state.game);
    board.position(state.game);
    for (let msg of state.chat) {
        let splitMsg = msg.split(':');
        let userSpan = $('<span>').addClass('username').text(splitMsg[0] + ': ');
        let messageSpan = $('<span>').text(splitMsg.slice(1).join(':').trim());
        $('#messages').append($('<li>').append(userSpan, messageSpan).css('text-align', 'left'));
    }
    $('#messages').scrollTop($('#messages')[0].scrollHeight);

    // initialize userTeam based on localStorage
    userTeam = localStorage.getItem('team');
});

socket.on('team selected', function({team, username}) {
    if (username === localStorage.getItem('username')) {
        userTeam = team;
        if (team === 'w') {
            document.getElementById('white-team-btn').style.opacity = '0.6';
            document.getElementById('white-team-btn').style.pointerEvents = 'none';
        } else if (team === 'b') {
            document.getElementById('black-team-btn').style.opacity = '0.6';
            document.getElementById('black-team-btn').style.pointerEvents = 'none';
        }
    }
});

socket.on('teams update', function(teams) {
    if (teams['w']) {
        document.getElementById('white-team-btn').style.opacity = '0.6';
        document.getElementById('white-team-btn').style.pointerEvents = 'none';
        if (localStorage.getItem('username') === teams['w']) {
            userTeam = 'w';
        }
    } else {
        document.getElementById('white-team-btn').style.opacity = '1';
        document.getElementById('white-team-btn').style.pointerEvents = 'auto';
    }
    if (teams['b']) {
        document.getElementById('black-team-btn').style.opacity = '0.6';
        document.getElementById('black-team-btn').style.pointerEvents = 'none';
        if (localStorage.getItem('username') === teams['b']) {
            userTeam = 'b';
        }
    } else {
        document.getElementById('black-team-btn').style.opacity = '1';
        document.getElementById('black-team-btn').style.pointerEvents = 'auto';
    }
    if (userTeam) {
        document.getElementById('restart-btn').style.visibility = 'visible';
    } else {
        document.getElementById('restart-btn').style.visibility = 'hidden';
    }
});

socket.on('connect', function() {
    var username = localStorage.getItem('username');
    var team = localStorage.getItem('team');
    if (username && team) {
        userTeam = team;
        socket.emit('team selected', {team: team, username: username});
    }
});

socket.on('update elo', function(data) {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername === data.username) {
        const eloElement = document.getElementById('elo');
        eloElement.textContent = data.elo;
        localStorage.setItem('elo', data.elo);
    }
});

socket.on('move', function(msg) {
    game.load(msg);
    board.position(game.fen());
    updateStatus();
});

$('form').submit(function(e) {
    e.preventDefault();
    const username = localStorage.getItem('username');
    const message = `${username}: ${$('#input').val()}`;
    socket.emit('chat message', message);
    $('#input').val('');
    return false;
});

socket.on('chat message', function(msg) {
    let splitMsg = msg.split(':');
    let userSpan = $('<span>').addClass('username').text(splitMsg[0] + ': ');
    let messageSpan = $('<span>').text(splitMsg.slice(1).join(':').trim());
    $('#messages').append($('<li>').append(userSpan, messageSpan).css('text-align', 'left'));
    $('#messages').scrollTop($('#messages')[0].scrollHeight);
});

socket.on('restart', function(msg) {
    game = new Chess();
    board.position(game.fen());
    updateStatus();
    whiteTeamPlayer = null;
    blackTeamPlayer = null;
    userTeam = null;
    document.getElementById('white-team-btn').style.opacity = '1';
    document.getElementById('white-team-btn').style.pointerEvents = 'auto';
    document.getElementById('black-team-btn').style.opacity = '1';
    document.getElementById('black-team-btn').style.pointerEvents = 'auto';
    socket.emit('team selected', {team: 'w', username: null});
    socket.emit('team selected', {team: 'b', username: null});
});

$('#restart-btn').click(function() {
    game = new Chess();
    whiteTeamPlayer = null;
    blackTeamPlayer = null;
    userTeam = null;
    board.position('start');
    updateStatus();
    socket.emit('restart', 'start');
});

window.onload = function() {
    const usernameElement = document.getElementById('username');
    const eloElement = document.getElementById('elo');
    const storedUsername = localStorage.getItem('username');
    const storedElo = localStorage.getItem('elo');
    if (storedUsername && storedElo) {
        usernameElement.textContent = storedUsername;
        eloElement.textContent = storedElo;
    } else {
        usernameElement.textContent = 'Guest';
        eloElement.textContent = '0';
    }
};

document.getElementById("logout-btn").addEventListener("click", function() {
    fetch('/logout', {
        method: 'GET',
    }).then(() => {
        localStorage.removeItem('username');
        localStorage.removeItem('team');
        localStorage.removeItem('elo');
        window.location.href = '/index.html';
    });
});
