var socket = io();

// use chess.js for logic
var game = new Chess();

var board = Chessboard('myBoard', {
    position: 'start',
    draggable: true,
    pieceTheme: '../img/{piece}.png',
    onDrop: function(source, target) {
        // verify move is legal
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q' // always promote to a queen for example simplicity
        });

        // Illégal move
        if (move === null) {
            return 'snapback';
        }

        // If legal move, send move to server
        socket.emit('move', move);
    }
});

socket.on('move', function(msg) {
    // Do a local move if the move was legal
    var move = game.move(msg);

    // if the move was illegal, snapback
    if (move !== null) {
        board.position(game.fen(), false);
    }
});

// when form is submitted, prevent page from reloading, send message to server, and clear input field
$('#form').submit(function(e) {
    e.preventDefault();
    var message = $('#input').val();
    socket.emit('chat message', message);
    $('#input').val('');
});

// when a new message is received, append it to #messages
socket.on('chat message', function(msg) {
    $('#messages').append($('<li>').text(msg));
});
