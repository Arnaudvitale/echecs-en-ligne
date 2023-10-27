const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        trim: true,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        unique: false,
        lowercase: false
    },
    elo: {
        type: Number,
        default: 600
    }
});

module.exports = mongoose.model('User', userSchema);
