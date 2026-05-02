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
const io     = socketIo(server, {
    pingTimeout:  120000,
    pingInterval: 30000
});

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

function makeGame(name, createdBy, timerSeconds) {
    const id       = generateId();
    const timerSec = parseInt(timerSeconds) || 0;
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
        createdAt:    Date.now(),
        finished: false,
        timer: timerSec > 0
            ? { enabled: true, seconds: timerSec, w: timerSec, b: timerSec, active: null, lastTick: null, interval: null }
            : { enabled: false }
    });
    return games.get(id);
}

function gameSummary(g) {
    return { id: g.id, name: g.name, white: g.teams.w, black: g.teams.b, createdBy: g.createdBy, inProgress: g.fen !== null, timer: g.timer && g.timer.enabled ? g.timer.seconds : 0 };
}

function broadcastLobby() {
    io.emit('lobby update', Array.from(games.values()).map(gameSummary));
}

// ── ELO helpers ───────────────────────────────────────────────
function kFactor(elo) {
    if (elo >= 2400) return 16;
    if (elo >= 2100) return 24;
    return 32;
}

function resolveGame(g, winnerUser, loserUser, isDraw) {
    if (!g || g.finished) return;
    g.finished = true;
    if (g.timer && g.timer.interval) { clearInterval(g.timer.interval); g.timer.interval = null; }

    if (isDraw) {
        if (!winnerUser || !loserUser) {
            const sW = winnerUser && g.userToSocket[winnerUser];
            const sL = loserUser  && g.userToSocket[loserUser];
            const r  = { message: 'Game ended in a draw!', eloDelta: 0 };
            if (sW) io.to(sW).emit('game result', r);
            if (sL && sL !== sW) io.to(sL).emit('game result', r);
            return;
        }
        Promise.all([User.findOne({ username: winnerUser }), User.findOne({ username: loserUser })])
            .then(([uA, uB]) => {
                if (!uA || !uB) return;
                const eA = 1 / (1 + Math.pow(10, (uB.elo - uA.elo) / 400));
                const eB = 1 / (1 + Math.pow(10, (uA.elo - uB.elo) / 400));
                const dA = Math.round(kFactor(uA.elo) * (0.5 - eA));
                const dB = Math.round(kFactor(uB.elo) * (0.5 - eB));
                uA.elo = Math.max(0, uA.elo + dA);
                uB.elo = Math.max(0, uB.elo + dB);
                return Promise.all([uA.save(), uB.save()]).then(() => {
                    const rA = { message: 'Game ended in a draw!', eloDelta: dA };
                    const rB = { message: 'Game ended in a draw!', eloDelta: dB };
                    g.gameResult = { [winnerUser]: rA, [loserUser]: rB };
                    const sA = g.userToSocket[winnerUser], sB = g.userToSocket[loserUser];
                    if (sA) { io.to(sA).emit('update elo', { username: winnerUser, elo: uA.elo }); io.to(sA).emit('game result', rA); }
                    if (sB) { io.to(sB).emit('update elo', { username: loserUser,  elo: uB.elo }); io.to(sB).emit('game result', rB); }
                });
            }).catch(console.error);
        return;
    }

    if (!winnerUser || !loserUser) {
        if (winnerUser) { const s = g.userToSocket[winnerUser]; if (s) io.to(s).emit('game result', { message: 'You won! Well played.', eloDelta: null }); }
        if (loserUser)  { const s = g.userToSocket[loserUser];  if (s) io.to(s).emit('game result', { message: 'You lost. Better luck next time.', eloDelta: null }); }
        return;
    }

    Promise.all([User.findOne({ username: winnerUser }), User.findOne({ username: loserUser })])
        .then(([uW, uL]) => {
            if (!uW || !uL) return;
            const eW = 1 / (1 + Math.pow(10, (uL.elo - uW.elo) / 400));
            const eL = 1 / (1 + Math.pow(10, (uW.elo - uL.elo) / 400));
            const dW = Math.round(kFactor(uW.elo) * (1 - eW));
            const dL = Math.round(kFactor(uL.elo) * (0 - eL));
            uW.elo = Math.max(0, uW.elo + dW);
            uL.elo = Math.max(0, uL.elo + dL);
            return Promise.all([uW.save(), uL.save()]).then(() => {
                const rW = { message: 'You won! Well played.',            eloDelta: dW };
                const rL = { message: 'You lost. Better luck next time.', eloDelta: dL };
                g.gameResult = { [winnerUser]: rW, [loserUser]: rL };
                const sW = g.userToSocket[winnerUser], sL = g.userToSocket[loserUser];
                if (sW) { io.to(sW).emit('update elo', { username: winnerUser, elo: uW.elo }); io.to(sW).emit('game result', rW); }
                if (sL) { io.to(sL).emit('update elo', { username: loserUser,  elo: uL.elo }); io.to(sL).emit('game result', rL); }
            });
        }).catch(console.error);
}

function timerSnapshot(g) {
    if (!g.timer || !g.timer.enabled) return null;
    let w = g.timer.w, b = g.timer.b;
    if (g.timer.active && g.timer.lastTick) {
        const elapsed = Math.floor((Date.now() - g.timer.lastTick) / 1000);
        const rem     = Math.max(0, g.timer[g.timer.active] - elapsed);
        if (g.timer.active === 'w') w = rem; else b = rem;
    }
    return { enabled: true, w, b, active: g.timer.active, seconds: g.timer.seconds };
}

function startTimerInterval(g) {
    if (g.timer.interval) clearInterval(g.timer.interval);
    g.timer.interval = setInterval(() => {
        if (!g.timer.active || g.finished) {
            clearInterval(g.timer.interval); g.timer.interval = null; return;
        }
        const elapsed   = Math.floor((Date.now() - g.timer.lastTick) / 1000);
        const remaining = Math.max(0, g.timer[g.timer.active] - elapsed);
        const update    = {
            w: g.timer.active === 'w' ? remaining : g.timer.w,
            b: g.timer.active === 'b' ? remaining : g.timer.b,
            active: g.timer.active
        };
        io.to(g.id).emit('timer update', update);
        if (remaining <= 0) {
            const loserColor  = g.timer.active;
            const winnerColor = loserColor === 'w' ? 'b' : 'w';
            resolveGame(g, g.teams[winnerColor], g.teams[loserColor], false);
        }
    }, 1000);
}

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', console.error.bind(console, 'DB error:'));
mongoose.connection.once('open', () => console.log('Connected to DB'));

io.on('connection', (socket) => {

    socket.on('get lobby', () => {
        socket.emit('lobby state', Array.from(games.values()).map(gameSummary));
    });

    socket.on('create game', ({ name, username, timerSeconds }) => {
        if (!username || username.toLowerCase().startsWith('guest')) return;
        const g = makeGame(name, username, timerSeconds);
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
        if (g.teams.w === username || g.teams.b === username) {
            g.userToSocket[username] = socket.id;
        }
        socket.emit('init', {
            game: g.fen || 'start', chat: g.chat, teams: g.teams,
            movesHistory: g.movesHistory, gameId: g.id, gameName: g.name,
            timer: timerSnapshot(g)
        });
        // Griser les bons boutons d'équipe dès l'arrivée
        socket.emit('teams update', g.teams);
        // Si la partie est terminée, renvoyer le résultat au joueur qui se reconnecte
        if (g.finished && g.gameResult && g.gameResult[username]) {
            socket.emit('game result', g.gameResult[username]);
        }
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
        const hasTimer = g.timer && g.timer.enabled;
        // Sans timer : démarrer dès le premier joueur
        // Avec timer : attendre que les deux équipes soient remplies
        if (!g.fen && (!hasTimer || (g.teams.w && g.teams.b))) {
            const startFen = g.firstTeam === 'b'
                ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1'
                : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            g.fen = startFen;
            io.to(gameId).emit('game start', { fen: startFen, timer: timerSnapshot(g) });
        }
        broadcastLobby();
    });

    socket.on('move', ({ from, to, gameId }) => {
        const g = games.get(gameId);
        if (!g || !g.fen || g.finished) return;
        // Avec timer : bloquer si l'adversaire n'est pas encore là
        if (g.timer && g.timer.enabled && (!g.teams.w || !g.teams.b)) return;
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
            if (g.timer && g.timer.enabled) {
                if (g.timer.active) {
                    const elapsed = Math.floor((Date.now() - g.timer.lastTick) / 1000);
                    g.timer[g.timer.active] = Math.max(0, g.timer[g.timer.active] - elapsed);
                }
                const next       = playerColor === 'w' ? 'b' : 'w';
                g.timer.active   = next;
                g.timer.lastTick = Date.now();
                io.to(gameId).emit('timer update', { w: g.timer.w, b: g.timer.b, active: next });
                startTimerInterval(g);
            }
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
        if (!g || g.finished) return;
        const isDraw = (winner === null && loser === null);
        const p1 = isDraw ? g.teams.w : winner;
        const p2 = isDraw ? g.teams.b : loser;
        resolveGame(g, p1, p2, isDraw);
    });

    socket.on('requestRestart', ({ username, gameId }) => {
        const g = games.get(gameId);
        if (!g) return;
        const other = g.teams.w === username ? g.teams.b : g.teams.w;
        const sid   = other && g.userToSocket[other];
        if (sid) {
            io.to(sid).emit('promptRestart', { username });
        } else {
            socket.emit('responseRestart', { username: other || username });
        }
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
        if (g.timer && g.timer.interval) { clearInterval(g.timer.interval); g.timer.interval = null; }
        if (g.timer && g.timer.enabled) {
            g.timer.w        = g.timer.seconds;
            g.timer.b        = g.timer.seconds;
            g.timer.active   = null;
            g.timer.lastTick = null;
        }
        g.finished     = false;
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
        const gid      = sock.currentGameId;
        if (!gid) return;
        const prevUser = sock.currentUser;
        sock.leave(gid);
        sock.currentGameId = null;
        sock.currentUser   = null;

        const g = games.get(gid);
        if (!g) return;

        delete g.socketToUser[sock.id];
        if (g.userToSocket[prevUser] === sock.id) delete g.userToSocket[prevUser];

        const isPlayer       = g.teams.w === prevUser || g.teams.b === prevUser;
        const gameInProgress = g.fen !== null && !g.finished && g.teams.w !== null && g.teams.b !== null;

        if (isPlayer && gameInProgress) {
            if (g.timer && g.timer.enabled) {
                // Partie avec timer : forfait immédiat
                const loserColor  = g.teams.w === prevUser ? 'w' : 'b';
                const winnerColor = loserColor === 'w' ? 'b' : 'w';
                resolveGame(g, g.teams[winnerColor], g.teams[loserColor], false);
            } else {
                // Partie sans timer : proposer restart ou forfait à l'adversaire
                const otherColor = g.teams.w === prevUser ? 'b' : 'w';
                const otherUser  = g.teams[otherColor];
                const otherSid   = otherUser && g.userToSocket[otherUser];
                if (otherSid) {
                    io.to(otherSid).emit('opponent disconnected', { username: prevUser });
                }
            }
        }

        const roomSize = (io.sockets.adapter.rooms.get(gid) || new Set()).size;
        if (roomSize === 0) {
            if (g.timer && g.timer.interval) { clearInterval(g.timer.interval); g.timer.interval = null; }
            games.delete(gid);
        }
        broadcastLobby();
    }
});

const port = 8080;
server.listen(port, '0.0.0.0', () => {
    console.log('Server listening on port ' + port);
});
