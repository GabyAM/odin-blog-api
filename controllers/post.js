const asyncHandler = require('express-async-handler');
const Post = require('../models/post');

exports.posts_list = asyncHandler(async (req, res, next) => {
    const posts = await Post.find({}).sort({ createdAt: -1 }).exec();

    res.send(posts);
});
