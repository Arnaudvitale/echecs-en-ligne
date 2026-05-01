require('dotenv').config();
const express    = require('express');
const http       = require('http');
const socketIo   = require('socket.io');
const mongoose   = require('mongoose');
const session    = require('express-session');
const routes     = require('./routes/route');
const bodyParser = require('body-parser');
const User       = require('./models/user');
const crypto     = require('crypto');
const { Chess }  = require('chess.js');

const app    = express();
const server = http.createServer(app);
const io     = socketIo(server);

app.use(express.static('public'));
app.use(session({
    secret:            process.env.SESSION_SECRET,
    resave:            false,
    saveUninitialized: false,
    cookie:            { secure: process.env.NODE_ENV === 'production' }
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', routes);

app.get('/chess',      (req, res) => res.sendFile(__dirname + '/public/chess.html'));
app.get('/game',       (req, res) => res.sendFile(__dirname + '/public/chessPhone.html'));
app.get('/lobby',      (req, res) => res.sendFile(__dirname + '/public/lobby.html'));
app.get('/login',      (req, res) => res.sendFile(__dirname + '/public/pc/loginpc.html'));
app.get('/login-page', (req, res) => res.sendFile(__dirname + '/public/phone/loginphone.html'));
app.get('/about',      (req, res) => res.sendFile(__dirname + '/public/devPage.html'));

const games = new Map();
let gameCounter = 1;

function generateId() {
    return crypto.randomBytes(4).toString('hex');
}

function makeGame(name, createdBy) {
    const id = generateId();
    games.set(id, {
        id,
        name:         name || ('Game #' + gameCounter++),
        fen:          null,
        teams:        { w: null, b: null },
        firstTeam:    null,
        movesHistory: [],
        chat:         [],
        socketToUser: {},
        userToSocket: {},
        createdBy,
        createdAt:    Date.now()
    });
    return games.get(id);
}

function gameSummary(g) {
    return { id: g.id, name: g.name, white: g.teams.w, black: g.teams.b, createdBy: g.createdBy, inProgress: g.fen !== null };
}

function broadcastLobby() {
    io.emit('lobby update', Array.from(games.values()).map(gameSummary));
}

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', console.error.bind(console, 'DB error:'));
mongoose.connection.once('open', () => console.log('Connected to DB'));

io.on('connection', (socket) => {

    socket.on('get lobby', () => {
        socket.emit('lobby state', Array.from(games.values()).map(gameSummary));
    });

    socket.on('create game', ({ name, username }) => {
        if (!username || username.toLowerCase().startsWith('guest')) return;
        const g = makeGame(name, username);
        broadcastLobby();
        socket.emit('game created', { id: g.id });
    });

    socket.on('join game', ({ gameId, username }) => {
        const g = games.get(gameId);
        if (!g) { socket.emit('game not found'); return; }
        if (socket.currentGameId && socket.currentGameId !== gameId) detachFromGame(socket);
        socket.join(gameId);
        socket.currentGameId = gameId;
        socket.currentUser   = username;
        g.socketToUser[socket.id] = username;
        socket.emit('init', {
            game: g.fen || 'start', chat: g.chat, teams: g.teams,
            movesHistory: g.movesHistory, gameId: g.id, gameName: g.name
        });
    });

    socket.on('team selected', ({ team, username, gameId }) => {
        const g = games.get(gameId);
        if (!g || !username || username.toLowerCase().startsWith('guest')) return;
        if (team !== 'w' && team !== 'b') return;
        if (g.teams[team]) return;
        g.teams[team] = username;
        g.userToSocket[username] = socket.id;
        if (g.firstTeam === null) g.firstTeam = team;
        io.to(gameId).emit('teams update', g.teams);
        if (g.teams.w && g.teams.b) {
            const startFen = g.firstTeam === 'b'
                ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1'
                : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            g.fen = startFen;
            io.to(gameId).emit('game start', { fen: startFen });
        }
        broadcastLobby();
    });

    socket.on('move', ({ from, to, gameId }) => {
        const g = games.get(gameId);
        if (!g || !g.fen) return;
        if (g.teams.w !== socket.currentUser && g.teams.b !== socket.currentUser) return;
        try {
            const chess = new Chess(g.fen);
            const playerColor = g.teams.w === socket.currentUser ? 'w' : 'b';
            if (chess.turn() !== playerColor) return;
            const move = chess.move({ from, to, promotion: 'q' });
            g.fen = chess.fen();
            const C = { w: 'White', b: 'Black' };
            const P = { p: 'pawn', r: 'rook', n: 'knight', b: 'bishop', q: 'queen', k: 'king' };
            g.movesHistory.push(C[move.color] + ' ' + P[move.piece] + ' ' + from + '\u2192' + to);
            io.to(gameId).emit('move', g.fen);
            io.to(gameId).emit('updateHistory', g.movesHistory);
            io.to(gameId).emit('move sound');
        } catch (e) { /* invalid move */ }
    });

    socket.on('chat message', ({ msg, gameId }) => {
        const g = games.get(gameId);
        if (!g || !msg || typeof msg !== 'string') return;
        const safe = msg.trim().slice(0, 200);
        if (!safe) return;
        if (g.chat.length > 150) g.chat = g.chat.slice(-150);
        g.chat.push(safe);
        io.to(gameId).emit('chat message', safe);
    });

    socket.on('end game', ({ winner, loser, gameId }) => {
        const g = games.get(gameId);
        if (!g) return;
        if (winner === null && loser === null) {
            io.to(gameId).emit('game result', { message: 'Game ended in a draw!' });
            return;
        }
        function updateElo(username, delta, msg) {
            User.findOne({ username }).then(user => {
                if (!user) return;
                user.elo = Math.max(0, user.elo + delta);
                user.save().then(() => {
                    const sid = g.userToSocket[username];
                    if (sid) {
                        io.to(sid).emit('update elo', { username, elo: user.elo });
                        io.to(sid).emit('game result', { message: msg });
                    }
                });
            }).catch(console.error);
        }
        updateElo(winner, +10, 'You won! Well played.');
        updateElo(loser,  -10, 'You lost. Better luck next time.');
    });

    socket.on('requestRestart', ({ username, gameId }) => {
        const g = games.get(gameId);
        if (!g) return;
        const other = g.teams.w === username ? g.teams.b : g.teams.w;
        const sid   = other && g.userToSocket[other];
        if (sid) io.to(sid).emit('promptRestart', { username });
    });

    socket.on('responseRestart', ({ username, gameId }) => {
        const g = games.get(gameId);
        if (!g) return;
        const sid = g.userToSocket[username];
        if (sid) io.to(sid).emit('responseRestart', { username: socket.currentUser });
    });

    socket.on('restart', ({ gameId }) => {
        const g = games.get(gameId);
        if (!g) return;
        g.fen          = null;
        g.teams        = { w: null, b: null };
        g.firstTeam    = null;
        g.movesHistory = [];
        g.userToSocket = {};
        io.to(gameId).emit('teams update', g.teams);
        io.to(gameId).emit('restart');
        broadcastLobby();
    });

    socket.on('disconnect', () => detachFromGame(socket));

    function detachFromGame(sock) {
        const gid = sock.currentGameId;
        if (!gid) return;
        const g = games.get(gid);
        if (g) {
            delete g.socketToUser[sock.id];
            if (g.teams.w === sock.currentUser) {
                g.teams.w = null;
                delete g.userToSocket[sock.currentUser];
            } else if (g.teams.b === sock.currentUser) {
                g.teams.b = null;
                delete g.userToSocket[sock.currentUser];
            }
            io.to(gid).emit('teams update', g.teams);
            const roomSize = (io.sockets.adapter.rooms.get(gid) || new Set()).size;
            if (roomSize === 0) games.delete(gid);
            broadcastLobby();
        }
        sock.leave(gid);
        sock.currentGameId = null;
        sock.currentUser   = null;
    }
});

const port = 8080;
server.listen(port, '0.0.0.0', () => {
    console.log('Server listening on port ' + port);
});
