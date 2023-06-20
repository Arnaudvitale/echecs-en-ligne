// create new audio object
var moveSound = new Audio('../sound/move.mp3');

// create new socket connection
var socket = io();
var game = new Chess();

// update the board position after the piece snap
var updateStatus = function() {
    var statusEl = $('#status');
    var moveColor = game.turn() === 'b' ? 'Black' : 'White';
    statusEl.text('Turn: ' + moveColor);
};
updateStatus();

var board = Chessboard('myBoard', {
    position: 'start',
    draggable: true,
    pieceTheme: '../img/{piece}.png',
    onDrop: function(source, target) {
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });
        if (move === null) {
            return 'snapback';
        }
        updateStatus();
        socket.emit('move', game.fen());

        // play sound
        moveSound.play().catch(error => console.log('Error playing sound:', error));
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

$('#restart-btn').click(function() {
    game = new Chess();
    board.position('start');
    updateStatus();
    socket.emit('move', 'start');
});

window.onload = function() {
    const usernameElement = document.getElementById('username');
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
        usernameElement.textContent = storedUsername;
    } else {
        usernameElement.textContent = 'Guest';
    }
};

document.getElementById("logout-btn").addEventListener("click", function() {
    fetch('/logout', {
        method: 'GET',
    }).then(() => {
        localStorage.removeItem('username');
        window.location.href = '/index.html';
    });
});
