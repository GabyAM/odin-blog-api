const asyncHandler = require('express-async-handler');
const Post = require('../models/post');

exports.posts_list = asyncHandler(async (req, res, next) => {
    const posts = await Post.find({}).sort({ createdAt: -1 }).exec();

    res.send(posts);
});

exports.post_detail = asyncHandler(async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id).exec();
        res.send(post);
    } catch {
        const error = new Error('post not found');
        error.status = 404;
        return next(error);
    }
});

exports.user_posts = asyncHandler(async (req, res, next) => {
    const posts = await Post.find(
        { author: req.params.id },
        'title summary'
    ).exec();
    res.send(posts);
});
