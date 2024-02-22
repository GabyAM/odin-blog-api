const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    email: String,
    password: String,
    is_admin: Boolean
});

const User = mongoose.model('User', userSchema);
module.exports = User;
