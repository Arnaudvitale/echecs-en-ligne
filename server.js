require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const session = require('express-session');
const routes = require('./routes/route');
const bodyParser = require('body-parser');
const User = require('./models/user');

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
let userToSocketId = {};
let teams = {
    'w': false,
    'b': false
};

// MongoDB connection
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("connected to the database");
});

io.on('connection', (socket) => {
    numUsers++;
    console.log('------------------');
    console.log('A user connected. Total users: ', numUsers);

    // Send current game state and chat messages
    socket.emit('init', { game: currentGame, chat: chatMessages, teams: teams });

    socket.on('team selected', function({team, username}) {
        if (!teams[team]) {
            teams[team] = username;
            userToSocketId[username] = socket.id;
            socket.username = username;
            io.emit('teams update', teams);
        }
    });

    socket.on('move', function(msg) {
        if (!(teams['w'] === socket.username || teams['b'] === socket.username)) {
            return;
        }
        currentGame = msg;
        io.emit('move', msg);
    });

    socket.on('chat message', function(msg) {
        if (chatMessages.length > 200) {
            chatMessages = chatMessages.slice(-200);
        }
        chatMessages.push(msg);
        io.emit('chat message', msg);
    });

    socket.on('end game', function({ winner, loser }) {

        if (winner === null && loser === null) {
            return;
        }

        User.findOne({username: winner})
        .then(user => {
            if(!user) {
                console.error(`User not found: ${winner}`);
                return;
            }
            user.elo = user.elo + 10;
            user.save().then(() => {
                io.to(userToSocketId[winner]).emit('update elo', { username: winner, elo: user.elo }); // send to correct socket id
            });
        })
        .catch(err => {
            console.error(err);
        });

        User.findOne({username: loser})
        .then(user => {
            if(!user) {
                console.error(`User not found: ${loser}`);
                return;
            }
            user.elo = Math.max(user.elo - 10, 0); // Don't let ELO drop below 0
            user.save().then(() => {
                io.to(userToSocketId[loser]).emit('update elo', { username: loser, elo: user.elo }); // send to correct socket id
            });
        })
        .catch(err => {
            console.error(err);
        });

        teams = {
            'w': false,
            'b': false
        };
        // Here we set the game state back to start
        currentGame = 'start';
        io.emit('teams update', teams);
    });

    socket.on('restart', function(msg) {
        currentGame = msg;
        teams = {
            'w': false,
            'b': false
        };
        io.emit('teams update', teams); // Change to io.emit
        io.emit('restart', msg); // Change to io.emit
        io.emit('teams update', teams); // Change to io.emit
    });

    socket.on('disconnect', () => {
        numUsers--;
        console.log('------------------');
        console.log('A user disconnected. Total users: ', numUsers);
        if (teams['w'] === socket.username) {
            teams['w'] = false;
        } else if (teams['b'] === socket.username) {
            teams['b'] = false;
        }
        delete userToSocketId[socket.username];
        io.emit('teams update', teams);
        if (numUsers == 0) {
            currentGame = 'start';
            chatMessages = [];
            teams = {
                'w': false,
                'b': false
            };
            io.emit('teams update', teams);
        }
    });

    io.emit('teams update', teams);

    if (teams['w'] === socket.username) {
        socket.emit('team selected', {team: 'w', username: socket.username});
    } else if (teams['b'] === socket.username) {
        socket.emit('team selected', {team: 'b', username: socket.username});
    }
});

const port = 8080;
server.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`)
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use("/", routes);
