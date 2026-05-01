/* =============================================================
   Chess App — UI Utilities
   Fonctions d'affichage partagées PC & mobile.
   ============================================================= */

function realisticConfetti() {
    var count    = 200;
    var defaults = { origin: { y: 0.7 } };
    function fire(ratio, opts) {
        confetti(Object.assign({}, defaults, opts, {
            particleCount: Math.floor(count * ratio)
        }));
    }
    fire(0.25, { spread: 26,  startVelocity: 55 });
    fire(0.20, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.10, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.10, { spread: 120, startVelocity: 45 });
}

function removeGreySquares() {
    $('#myBoard .square-55d63').css('background', '');
}

function greySquare(square) {
    var $sq = $('#myBoard .square-' + square);
    var bg  = $sq.hasClass('black-3c85d') ? blackSquareGrey : whiteSquareGrey;
    $sq.css('background', bg);
}

function updateStatus() {
    var color  = game.turn() === 'w' ? 'White' : 'Black';
    var player = game.turn() === 'w' ? whiteTeamPlayer : blackTeamPlayer;
    var text   = player ? 'Turn: ' + color + ' (' + player + ')' : 'Turn: ' + color;
    var el = document.getElementById('status');
    if (el) el.textContent = text;
}

function isKingInCheck() {
    if (game.in_check()) {
        playSound(checkSound);
    }
}

function displayMovesHistory(history) {
    var listEl      = document.getElementById('movesHistory');
    var containerEl = document.getElementById('movesHistoryContainer');
    if (!listEl) return;

    listEl.innerHTML = '';

    history.forEach(function(move, i) {
        var li       = document.createElement('li');
        li.textContent = (i + 1) + '. ' + move;
        listEl.appendChild(li);
    });

    if (game.in_check()) {
        var li       = document.createElement('li');
        li.className   = 'check-alert';
        li.textContent = (game.turn() === 'w' ? 'White' : 'Black') + ' King in check!';
        listEl.appendChild(li);
    }

    if (game.game_over()) {
        var li       = document.createElement('li');
        li.className   = 'game-over-alert';
        li.textContent = 'Game over';
        listEl.appendChild(li);
    }

    if (containerEl) containerEl.scrollTop = containerEl.scrollHeight;
}
