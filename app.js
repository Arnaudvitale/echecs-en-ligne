const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let numUsers = 0;

io.on('connection', (socket) => {
    // when a user connects, broadcast it to all users
    numUsers++;
    console.log('------------------');
    console.log('A user connected. Total users: ', numUsers);

    // when a move is received, broadcast it to all users
    socket.on('move', function(msg) {
        socket.broadcast.emit('move', msg);
    });
    
    // when a message is received, emit it to all users
    socket.on('chat message', function(msg) {
        io.emit('chat message', msg);
    });

    // when a user disconnects, broadcast it to all users
    socket.on('disconnect', () => {
        numUsers--;
        console.log('------------------');
        console.log('A user disconnected. Total users: ', numUsers);

    });
})

const port = 3000;
server.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`)
});
