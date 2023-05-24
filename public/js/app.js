var socket = io();
var game = new Chess();
var boardElement = document.getElementById('chessboard');
var role = null;
var selectedSquare = null;

// Generate chessboard
for (let i = 0; i < 64; i++) {
    var square = document.createElement('div');
    square.id = i;
    square.className = 'square';
    square.onclick = makeMove;
    boardElement.appendChild(square);
}

socket.on('role', (newRole) => {
    role = newRole;
});

function makeMove(event) {
    if (role !== 'player') {
        return;
    }

    var target = event.target.id;

    if (selectedSquare === null) {
        selectedSquare = target;
        event.target.style.backgroundColor = "yellow";  // Highlight the selected square
    } else {
        var move = game.move({
            from: idToSquare(selectedSquare),
            to: idToSquare(target),
            promotion: 'q'  // Always promote to queen for simplicity
        });

        if (move === null) {
            alert('Invalid move');
        } else {
            socket.emit('move', move);
        }

        selectedSquare = null;
        drawBoard();  // Remove the highlight
    }
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
            var pieceImage = getPieceImage(piece);
            square.innerHTML = `<img src="${pieceImage}" alt="${piece.type}">`;
        }

        square.style.backgroundColor = null;  // Remove the highlight
    }
}

function getPieceImage(piece) {
    var prefix = piece.color === 'w' ? 'w' : 'b';
    var suffix;
    switch (piece.type) {
        case 'p': suffix = 'p'; break;
        case 'r': suffix = 'r'; break;
        case 'n': suffix = 'n'; break;
        case 'b': suffix = 'b'; break;
        case 'q': suffix = 'q'; break;
        case 'k': suffix = 'k'; break;
    }
    return `images/${prefix}${suffix}.svg`;
}

function idToSquare(id) {
    var file = String.fromCharCode('a'.charCodeAt(0) + id % 8);
    var rank = 8 - Math.floor(id / 8);
    return file + rank;
}

drawBoard();
