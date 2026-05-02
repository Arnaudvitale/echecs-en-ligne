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
    var colorKey = game.turn() === 'w' ? 'white' : 'black';
    var player   = game.turn() === 'w' ? whiteTeamPlayer : blackTeamPlayer;
    var colorLabel = t(colorKey);
    colorLabel = colorLabel.charAt(0).toUpperCase() + colorLabel.slice(1);
    var text = player ? t('turn') + ': ' + colorLabel + ' (' + player + ')' : t('turn') + ': ' + colorLabel;
    var el = document.getElementById('status');
    if (el) el.textContent = text;
}

function isKingInCheck() {
    if (game.in_check()) {
        playSound(checkSound);
    }
}

var lastHistoryMoves = [];
var isPreviewMode    = false;

function displayMovesHistory(history) {
    lastHistoryMoves = history || [];
    var listEl      = document.getElementById('movesHistory');
    var containerEl = document.getElementById('movesHistoryContainer');
    if (!listEl) return;

    listEl.innerHTML = '';

    for (var i = 0; i < history.length; i += 2) {
        var li       = document.createElement('li');
        var moveNum  = Math.floor(i / 2) + 1;
        var white    = history[i];
        var black    = history[i + 1] || '';
        li.innerHTML =
            '<span class="move-num">' + moveNum + '.</span>' +
            '<span class="move-w" data-move-idx="' + i + '">'       + white + '</span>' +
            (black ? '<span class="move-b" data-move-idx="' + (i + 1) + '">' + black + '</span>' : '<span class="move-b"></span>');
        listEl.appendChild(li);
    }

    // Listeners de prévisualisation (spectateurs uniquement)
    if (!userTeam) {
        listEl.querySelectorAll('.move-w[data-move-idx], .move-b[data-move-idx]').forEach(function(span) {
            span.style.cursor = 'pointer';
            span.addEventListener('click', function(e) {
                e.stopPropagation();
                previewMoveAt(parseInt(span.getAttribute('data-move-idx')));
            });
        });
    }

    if (game.in_check()) {
        var li       = document.createElement('li');
        li.className   = 'check-alert';
        var colorKey   = game.turn() === 'w' ? 'white' : 'black';
        var label      = t(colorKey);
        label          = label.charAt(0).toUpperCase() + label.slice(1);
        li.textContent = label + ' — ' + t('king-check');
        listEl.appendChild(li);
    }

    if (game.game_over()) {
        var li       = document.createElement('li');
        li.className   = 'game-over-alert';
        li.textContent = t('game-over');
        listEl.appendChild(li);
    }

    if (containerEl) containerEl.scrollTop = containerEl.scrollHeight;
}

function previewMoveAt(idx) {
    if (userTeam) return;
    var temp = new Chess();
    for (var i = 0; i <= idx && i < lastHistoryMoves.length; i++) {
        temp.move(lastHistoryMoves[i]);
    }
    board.position(temp.fen());
    isPreviewMode = true;

    document.querySelectorAll('#movesHistory .move-preview-active').forEach(function(s) {
        s.classList.remove('move-preview-active');
    });
    var active = document.querySelector('#movesHistory [data-move-idx="' + idx + '"]');
    if (active) active.classList.add('move-preview-active');

    var banner = document.getElementById('preview-banner');
    if (banner) banner.style.display = 'block';
}

function exitPreview() {
    if (!isPreviewMode) return;
    isPreviewMode = false;
    board.position(game.fen());
    document.querySelectorAll('#movesHistory .move-preview-active').forEach(function(s) {
        s.classList.remove('move-preview-active');
    });
    var banner = document.getElementById('preview-banner');
    if (banner) banner.style.display = 'none';
}

function formatTime(seconds) {
    if (seconds < 0) seconds = 0;
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
}

function updateTimers(data) {
    var row = document.getElementById('timers-row');
    if (!row) return;
    row.style.display = 'flex';
    ['w', 'b'].forEach(function(color) {
        var box    = document.getElementById('timer-' + color);
        var timeEl = document.getElementById('timer-' + color + '-time');
        if (!box || !timeEl) return;
        timeEl.textContent = formatTime(data[color] != null ? data[color] : 0);
        box.classList.toggle('timer-active', data.active === color);
        box.classList.toggle('timer-low', data.active === color && data[color] <= 30);
    });
}
