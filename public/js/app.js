var socket = io();
var game = new Chess();
var moveSound = new Audio('../sound/move.mp3');
var kingInCheckSound = new Audio('../sound/cry.mp3');
var winnerSound = new Audio('../sound/win.mp3');
var loserSound = new Audio('../sound/lose.mp3');
var whiteSquareGrey = '#a9a9a9';
var blackSquareGrey = '#696969';
var userTeam = null;
let whiteTeamPlayer = null;
let blackTeamPlayer = null;

// history for people who join the game
function displayMovesHistory(movesHistory) {
    var movesList = document.getElementById('movesHistory');
    movesList.innerHTML = '';

    movesHistory.forEach(function(move, index) {
        var li = document.createElement('li');
        li.textContent = `Move ${index + 1}: ${move}`;
        movesList.appendChild(li);
    });
}

// check if king is in check and play sound
function isKingInCheck() {
    if (game.in_check()) {
        kingInCheckSound.play().catch(error => console.log('Error playing sound:', error));
    }
}

// confetti visual effect
function realisticConfetti() {
    var count = 200;
    var defaults = {
      origin: { y: 0.7 }
    };
    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
}

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

// update the status of person who's playing
var updateStatus = function() {
    let moveColor = game.turn() === 'w' ? 'White' : 'Black';
    let currentTurnPlayer = game.turn() === 'w' ? whiteTeamPlayer : blackTeamPlayer;
    if (currentTurnPlayer === null) {
        document.getElementById('status').innerHTML = `Turn: ${moveColor}`;
    } else {
        document.getElementById('status').innerHTML = `Turn: ${moveColor} (${currentTurnPlayer})`;
    }
};
updateStatus();

// initialize board and game
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
        var piece = game.get(source);
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });
        if (move === null) return 'snapback';
        updateStatus();
        socket.emit('move', game.fen(), piece, source, target);

        // end game condition
        if (game.game_over()) {
            let winner, loser;
            if (game.in_draw()) { // Draw
                winner = loser = null;
            } else if (game.turn() === 'b') { // Whites have won
                winner = localStorage.getItem('whiteTeamPlayer');
                loser = localStorage.getItem('blackTeamPlayer');
            } else { // Blacks have won
                winner = localStorage.getItem('blackTeamPlayer');
                loser = localStorage.getItem('whiteTeamPlayer');
            }
            socket.emit('end game', { winner: winner, loser: loser });
            let moveColor2 = game.turn() === 'w' ? 'White' : 'Black';
            document.getElementById('status').innerHTML = `Turn: ${moveColor2}`;
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

/* getElements */
document.getElementById('white-team-btn').addEventListener('click', function() {
    whiteTeamPlayer = localStorage.getItem('username');
    if (userTeam) return;
    userTeam = 'w';
    this.style.opacity = '0.6';
    this.style.pointerEvents = 'none';
    document.getElementById('black-team-btn').style.pointerEvents = 'none';
    localStorage.setItem('team', 'w');
    socket.emit('team selected', {team: 'w', username: localStorage.getItem('username')});
    board.orientation('white');
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
    board.orientation('black');
});

document.getElementById("logout-btn").addEventListener("click", function() {
    fetch('/logout', {
        method: 'GET',
    }).then(() => {
        localStorage.removeItem('username');
        localStorage.removeItem('whiteTeamPlayer');
        localStorage.removeItem('blackTeamPlayer');
        localStorage.removeItem('team');
        localStorage.removeItem('elo');
        window.location.href = '/index.html';
    });
});

document.getElementById('myBoard').addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });
/* End getElements */

/* Socket */
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
    displayMovesHistory(state.movesHistory);
});

socket.on('updateHistory', function(movesHistory) {
    const historyElement = document.getElementById('movesHistory');
    historyElement.innerHTML = '';
    movesHistory.forEach(function(move, index) {
        const moveElement = document.createElement('li');
        moveElement.textContent = `Move ${index + 1}: ${move}`;
        historyElement.appendChild(moveElement);
    });
});

// game result
socket.on('game result', function(data) {
    // Show the SweetAlert message
    swal({
        title: data.message,
        buttons: {
            confirm: {
                text: 'OK',
                value: true,
                visible: true,
                className: 'btn btn-primary',
                closeModal: true
            }
        }
    });
    if (data.message.startsWith('Bien joué')) {
        winnerSound.play().catch(error => console.log('Error playing sound:', error));
        realisticConfetti();
    } else {
        loserSound.play().catch(error => console.log('Error playing sound:', error));
    }
});

socket.on('team selected', function({team, username}) {
    if (team === 'w') {
        whiteTeamPlayer = username;
        document.getElementById('white-team-btn').style.opacity = '0.6';
        document.getElementById('white-team-btn').style.pointerEvents = 'none';
        if (username === localStorage.getItem('username')) {
            userTeam = team;
        }
    } else if (team === 'b') {
        blackTeamPlayer = username;
        document.getElementById('black-team-btn').style.opacity = '0.6';
        document.getElementById('black-team-btn').style.pointerEvents = 'none';
        if (username === localStorage.getItem('username')) {
            userTeam = team;
        }
    }
    updateStatus();
});

socket.on('teams update', function(teams) {
    if (teams['w']) {
        whiteTeamPlayer = teams['w'];
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
        blackTeamPlayer = teams['b'];
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

// move sound
socket.on('move sound', function() {
    moveSound.play().catch(error => console.log('Error playing sound:', error));
});

// make a move
socket.on('move', function(msg) {
    game.load(msg);
    board.position(game.fen());
    if (userTeam === 'w' || userTeam === null) {
        board.orientation('white');
    } else if (userTeam === 'b') {
        board.orientation('black');
    }
    updateStatus();
    isKingInCheck();
});

// restart game
socket.on('restart', function(msg) {
    game = new Chess();
    board.position(game.fen());
    updateStatus();
    whiteTeamPlayer = null;
    blackTeamPlayer = null;
    userTeam = null;
    winnerSound.pause();
    loserSound.pause();
    localStorage.removeItem('whiteTeamPlayer');
    localStorage.removeItem('blackTeamPlayer');
    localStorage.removeItem('team');
    document.getElementById('white-team-btn').style.opacity = '1';
    document.getElementById('white-team-btn').style.pointerEvents = 'none';
    document.getElementById('black-team-btn').style.opacity = '1';
    document.getElementById('black-team-btn').style.pointerEvents = 'none';
    document.getElementById('movesHistory').innerHTML = '';
    socket.emit('team selected', {team: 'w', username: null});
    socket.emit('team selected', {team: 'b', username: null});
    board.orientation('white');
});
/* End Socket */

/* Chat */
var inputField = document.getElementById('input');
inputField.addEventListener('input', function() {
    if (inputField.value.length >= 150) {
        inputField.style.border = '2px solid red';
    } else {
        inputField.style.border = '';
    }
});

// message list
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
    $('#messages').append($('<li>').append(userSpan, messageSpan).css('text-align', 'left').css('word-wrap', 'break-word').css('max-width', '400px'));
    $('#messages').scrollTop($('#messages')[0].scrollHeight);
});
/* End Chat */

// restart game
$('#restart-btn').click(function() {
    game = new Chess();
    whiteTeamPlayer = null;
    blackTeamPlayer = null;
    userTeam = null;
    board.position('start');
    updateStatus();
    document.getElementById('white-team-btn').style.opacity = '0.6';
    document.getElementById('white-team-btn').style.pointerEvents = 'auto';
    document.getElementById('black-team-btn').style.opacity = '0.6';
    document.getElementById('black-team-btn').style.pointerEvents = 'auto';
    document.getElementById('movesHistory').innerHTML = '';
    socket.emit('restart', 'start');
});

// on page refresh
window.addEventListener('beforeunload', function() {
    if (this.localStorage.getItem("whiteTeamPlayer") === this.localStorage.getItem("username")) {
        localStorage.removeItem('whiteTeamPlayer');
    } else if (this.localStorage.getItem("blackTeamPlayer") === this.localStorage.getItem("username")) {
        localStorage.removeItem('blackTeamPlayer');
    }
    localStorage.removeItem('team');
});

// on page load
window.onload = function() {
    const usernameElement = document.getElementById('username');
    const eloElement = document.getElementById('elo');
    const storedUsername = localStorage.getItem('username');
    const storedElo = localStorage.getItem('elo');
    if (storedUsername && storedElo) {
        usernameElement.textContent = storedUsername;
        eloElement.textContent = storedElo;
    } else {
        window.location.href = '/index.html';
    }
};
