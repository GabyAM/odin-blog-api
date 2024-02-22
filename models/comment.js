const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema(
    {
        post: { type: Schema.Types.ObjectId, ref: 'Post' },
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        text: String,
        parent_comment: {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
            default: null
        },
        comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }]
    },
    { timestamps: true }
);

commentSchema.virtual('url').get(function () {
    return `/comment/:${this._id}`;
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
