require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const session = require('express-session');
const routes = require('./routes/route');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

let numUsers = 0;
let currentGame = 'start';
let chatMessages = [];

// MongoDB connection
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("We're connected to the database!");
});

io.on('connection', (socket) => {
    numUsers++;
    console.log('------------------');
    console.log('A user connected. Total users: ', numUsers);

    // Send current game state and chat messages
    socket.emit('init', { game: currentGame, chat: chatMessages });

    socket.on('move', function(msg) {
        currentGame = msg;
        socket.broadcast.emit('move', msg);
    });

    socket.on('chat message', function(msg) {
        if (chatMessages.length > 200) {
            chatMessages = chatMessages.slice(-200);
        }
        chatMessages.push(msg);
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        numUsers--;
        console.log('------------------');
        console.log('A user disconnected. Total users: ', numUsers);
        if (numUsers == 0) {
            currentGame = 'start';
            chatMessages = [];
        }
    });
})

const port = 3000;
server.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`)
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use("/", routes);
