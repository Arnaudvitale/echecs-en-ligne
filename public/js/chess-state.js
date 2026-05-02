var socket = io();
var game   = new Chess();
var board  = null;

var userTeam        = null;
var whiteTeamPlayer = null;
var blackTeamPlayer = null;
var timerEnabled    = false;

var whiteSquareGrey = '#a9a9a9';
var blackSquareGrey = '#696969';

var gameId = new URLSearchParams(window.location.search).get('id');

var moveSound     = new Audio('/sound/move.mp3');
var checkSound    = new Audio('/sound/kingInCheck.wav');
var equalitySound = new Audio('/sound/equality.mp3');
var winSound      = new Audio('/sound/win.mp3');
var loseSound     = new Audio('/sound/lose.mp3');

function playSound(sound) {
    sound.play().catch(function() {});
}
