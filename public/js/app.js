var socket = io();

// use chess.js for logic
var game = new Chess();

// Function to update game status
var updateStatus = function() {
    var statusEl = $('#status');
    var moveColor = game.turn() === 'b' ? 'Black' : 'White';

    statusEl.text('Turn: ' + moveColor);
};

// Initialize status
updateStatus();

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

        // If legal move, update status and send move to server
        updateStatus();
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

    // Update status after move
    updateStatus();
});

$('form').submit(function(e) {
    e.preventDefault(); // prevents page reloading
    socket.emit('chat message', $('#input').val());
    $('#input').val('');
    return false;
});

$('#restart-btn').click(function() {
    game = new Chess(); // Reset the game
    board.position('start'); // Reset the board
    updateStatus(); // Update game status
});

socket.on('chat message', function(msg) {
    $('#messages').append($('<li>').text(msg));
    $('#messages').scrollTop($('#messages')[0].scrollHeight);
});

// After logout code
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
        localStorage.removeItem('username'); // Remove username from local storage
        window.location.href = '/index.html'; // Redirect to index page
    });
});
