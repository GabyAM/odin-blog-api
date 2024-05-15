const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    email: String,
    password: String,
    is_admin: { type: Boolean, default: false },
    is_banned: { type: Boolean, default: false },
    image: { type: String, default: '/images/profile.png' },
    saved_posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }]
});

const User = mongoose.model('User', userSchema);
module.exports = User;
