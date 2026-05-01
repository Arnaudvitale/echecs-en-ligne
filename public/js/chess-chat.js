/* =============================================================
   Chess App — Chat
   ============================================================= */

var inputField = document.getElementById('input');
if (inputField) {
    inputField.addEventListener('input', function() {
        inputField.style.borderColor = inputField.value.length >= 150 ? 'red' : '';
    });
}

$('form#form').submit(function(e) {
    e.preventDefault();
    var msg = $('#input').val().trim();
    if (!msg) return false;
    var username = localStorage.getItem('username') || 'Guest';
    socket.emit('chat message', { msg: username + ': ' + msg, gameId: gameId });
    $('#input').val('');
    return false;
});

socket.on('chat message', function(msg) {
    var parts    = msg.split(':');
    var userSpan = $('<span>').addClass('username').text(parts[0] + ': ');
    var textSpan = $('<span>').text(parts.slice(1).join(':').trim());
    var el = document.getElementById('messages');
    $('#messages').append($('<li>').append(userSpan, textSpan));
    if (el) el.scrollTop = el.scrollHeight;
});
