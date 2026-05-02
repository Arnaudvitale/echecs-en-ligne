var draggedPieceSource = null;

window.addEventListener('load', function() {
    var boardEl = document.getElementById('myBoard');
    if (boardEl && boardEl.parentElement) {
        var pw = boardEl.parentElement.offsetWidth;
        boardEl.style.width = (pw > 64 ? Math.min(pw - 32, 480) : 480) + 'px';
    }

    board = Chessboard('myBoard', {
        position:   game.fen(),
        draggable:  true,
        pieceTheme: '/img/{piece}.png',

        onDragStart: function(source, piece) {
            if (game.game_over()) return false;
            if (!userTeam)  return false;
            if (userTeam === 'w' && /^b/.test(piece)) return false;
            if (userTeam === 'b' && /^w/.test(piece)) return false;
            draggedPieceSource = source;
            var moves = game.moves({ square: source, verbose: true });
            removeGreySquares();
            greySquare(source);
            moves.forEach(function(m) { greySquare(m.to); });
        },

        onDrop: function(source, target) {
            if (!userTeam) return 'snapback';
            removeGreySquares();
            draggedPieceSource = null;

            var move = game.move({ from: source, to: target, promotion: 'q' });
            if (move === null) return 'snapback';

            updateStatus();
            socket.emit('move', { from: source, to: target, gameId: gameId });

            if (game.game_over()) {
                var winner, loser;
                if (game.in_draw()) {
                    winner = loser = null;
                } else if (game.turn() === 'b') {
                    winner = localStorage.getItem('whiteTeamPlayer');
                    loser  = localStorage.getItem('blackTeamPlayer');
                } else {
                    winner = localStorage.getItem('blackTeamPlayer');
                    loser  = localStorage.getItem('whiteTeamPlayer');
                }
                socket.emit('end game', { winner: winner, loser: loser, gameId: gameId });
            }
        },

        onMouseoutSquare:  function() { if (!draggedPieceSource) removeGreySquares(); },

        onMouseoverSquare: function(square, piece) {
            if (!piece || !userTeam || draggedPieceSource) return;
            var c = piece.charAt(0);
            if ((userTeam === 'w' && c === 'b') || (userTeam === 'b' && c === 'w')) return;
            var moves = game.moves({ square: square, verbose: true });
            if (!moves.length) return;
            greySquare(square);
            moves.forEach(function(m) { greySquare(m.to); });
        },

        onSnapEnd: function() {
            removeGreySquares();
            draggedPieceSource = null;
            board.position(game.fen());
        }
    });

    updateStatus();

    if (boardEl) {
        boardEl.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, { passive: false });
    }
});
