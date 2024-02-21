const mongoose = require('mongoose');
const User = require('./user');
const Schema = mongoose.Schema;

const Admin = User.discriminator(
    'Admin',
    new Schema({
        posts: { type: Schema.Types.ObjectId, ref: 'Post' }
    })
);

module.exports = Admin;
