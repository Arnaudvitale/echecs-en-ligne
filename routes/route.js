const express = require('express');
const router = express.Router();
const user = require('../models/user');

router.post("/register", (req, res) => {
    const new_user = new user({username: req.body.username, password: req.body.password});
    new_user.save();
});

router.post("/login", (req, res) => {
    user.findOne({username: req.body.username}).then((user_found) => {
        if(user_found.password == req.body.password) res.send('ok');
    });
});

module.exports = router;