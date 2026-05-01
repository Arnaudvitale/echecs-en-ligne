const express  = require('express');
const router   = express.Router();
const User     = require('../models/user');
const bcrypt   = require('bcrypt');

const SALT_ROUNDS = 10;


router.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || username.length > 30 || password.length < 4) {
        return res.send({ status: 'error', message: 'Invalid input' });
    }
    User.findOne({ username }).then(found => {
        if (found) return res.send({ status: 'error', message: 'Username already taken' });
        bcrypt.hash(password, SALT_ROUNDS).then(hash => {
            new User({ username, password: hash }).save()
                .then(() => res.send({ status: 'ok', message: 'Registered ' + username }))
                .catch(err => res.send({ status: 'error', message: err.message }));
        });
    }).catch(err => res.send({ status: 'error', message: err.message }));
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.send({ status: 'error', message: 'Invalid input' });
    User.findOne({ username }).then(found => {
        if (!found) return res.send({ status: 'error', message: 'Incorrect username or password' });
        bcrypt.compare(password, found.password).then(match => {
            if (!match) return res.send({ status: 'error', message: 'Incorrect username or password' });
            req.session.username = found.username;
            res.send({ status: 'ok', username: found.username, elo: found.elo });
        });
    }).catch(() => res.send({ status: 'error', message: 'Incorrect username or password' }));
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/index.html');
    });
});

module.exports = router;
