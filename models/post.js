const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema(
    {
        author: { type: Schema.Types.ObjectId, ref: 'User' },
        title: String,
        summary: String,
        text: String
    },
    { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
