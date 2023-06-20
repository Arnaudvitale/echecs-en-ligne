var socket = io();
var game = new Chess();
var moveSound = new Audio('../sound/move.mp3');
var whiteSquareGrey = '#a9a9a9';
var blackSquareGrey = '#696969';

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

var board = Chessboard('myBoard', {
    position: 'start',
    draggable: true,
    pieceTheme: '../img/{piece}.png',
    onDragStart: function(source, piece) {
        if (game.game_over()) return false;
        if ((game.turn() === 'w' && piece.search(/^b/) !== -1) || (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
    },
    onDrop: function(source, target) {
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
    },
    onMouseoutSquare: function(square, piece) {
        removeGreySquares();
    },
    onMouseoverSquare: function(square, piece) {
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
