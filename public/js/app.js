var socket = io();
var game = new Chess();
var boardElement = document.getElementById('chessboard');

for (let i = 0; i < 64; i++) {
    var square = document.createElement('div');
    square.id = i;
    square.className = 'square';
    square.onclick = makeMove;
    boardElement.appendChild(square);
}

function makeMove(event) {
    var source = game.turn() + event.target.id;
    var move = game.move(source, {sloppy: true});

    if (move === null) {
        return 'Invalid move';
    }

    socket.emit('move', move);
}

socket.on('move', function(move) {
    game.move(move);
    drawBoard();
});

function drawBoard() {
    var board = game.board();

    for (let i = 0; i < 64; i++) {
        var square = document.getElementById(i.toString());
        var file = i % 8;
        var rank = 7 - Math.floor(i / 8);
        var piece = board[rank][file];

        if (piece === null) {
            square.innerHTML = '';
        } else {
            square.innerHTML = piece.type;
        }
    }
}

drawBoard();
