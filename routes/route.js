const express = require('express');
const router = express.Router();
const User = require('../models/user');
const session = require('express-session');

router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set secure to true if using https
}));

router.post("/register", (req, res) => {
    User.findOne({username: req.body.username}).then((user_found) => {
        if(user_found) {
            res.send({ status: 'error', message: 'Username already taken' });
        } else {
            const new_user = new User({username: req.body.username, password: req.body.password});
            new_user.save()
                .then(() => res.send({ status: 'ok', message: `Registered ${req.body.username}`}))
                .catch(err => res.send({ status: 'error', message: err.message }));
        }
    }).catch((err) => {
        res.send({ status: 'error', message: err.message });
    });
});

router.post("/login", (req, res) => {
    User.findOne({username: req.body.username}).then((user_found) => {
        if(user_found.password == req.body.password) {
            req.session.username = req.body.username; // Save username in session
            res.send({ status: 'ok', username: req.body.username, elo: user_found.elo });
        } else {
            res.send({ status: 'error', message: 'Incorrect username or password' });
        }
    }).catch(() => {
        res.send({ status: 'error', message: 'User not found' });
    });
});

router.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/chess.html');
        }
        res.clearCookie(process.env.SESSION_SECRET);
        res.redirect('/index.html');
    });
});

module.exports = router;
