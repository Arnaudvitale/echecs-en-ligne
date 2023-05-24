const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('move', (move) => {
        socket.broadcast.emit('move', move);
    });
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`)
});
