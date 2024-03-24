const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    email: String,
    password: String,
    is_admin: Boolean,
    image: { type: String, default: '/images/profile.png' }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
