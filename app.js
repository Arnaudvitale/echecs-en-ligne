const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let playerCount = 0;

io.on('connection', (socket) => {
    console.log('a user connected');

    if (playerCount < 2) {
        playerCount++;
        socket.emit('role', 'player');
    } else {
        socket.emit('role', 'spectator');
    }

    socket.on('move', (move) => {
        socket.broadcast.emit('move', move);
    });

    socket.on('disconnect', () => {
        if (socket.role === 'player') {
            playerCount--;
        }
    });
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`)
});
