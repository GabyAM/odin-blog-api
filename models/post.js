const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema(
    {
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String },
        summary: { type: String },
        text: { type: String },
        is_published: { type: Boolean, default: false }
    },
    { timestamps: true }
);

postSchema.path('title').validate(function (value) {
    if (this.is_published) {
        return (
            typeof value === 'string' && value.length > 8 && value.length < 80
        );
    }
    return true;
});
postSchema.path('summary').validate(function (value) {
    if (this.is_published) {
        return (
            typeof value === 'string' && value.length > 8 && value.length < 80
        );
    }
    return true;
});
postSchema.path('text').validate(function (value) {
    if (this.is_published) {
        return typeof value === 'string' && value.length > 50;
    }
    return true;
});

postSchema.pre('save', function (next) {
    if (!this.is_published) {
        if (!this.title) {
            this.title = 'Untitled';
        }
        if (!this.summary) {
            this.summary = '';
        }
        if (!this.text) {
            this.text = '';
        }
    }
    next();
});
const Post = mongoose.model('Post', postSchema);
module.exports = Post;
