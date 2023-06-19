const express = require('express');
const router = express.Router();
const user = require('../models/user');
const session = require('express-session');

router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set secure to true if using https
}));

router.post("/register", (req, res) => {
    const new_user = new user({username: req.body.username, password: req.body.password});
    new_user.save();
});

router.post("/login", (req, res) => {
    user.findOne({username: req.body.username}).then((user_found) => {
        if(user_found.password == req.body.password) {
            req.session.username = req.body.username; // Save username in session
            res.send({ status: 'ok', username: req.body.username });
        } else {
            res.send({ status: 'error', message: 'Incorrect password' });
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
