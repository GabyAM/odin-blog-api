const asyncHandler = require('express-async-handler');
const Comment = require('../models/comment');

exports.comments_list = asyncHandler(async (req, res, next) => {
    const comments = await Comment.find({}).exec();
    res.send(comments);
});

exports.comment_detail = asyncHandler(async (req, res, next) => {
    const comment = await Comment.findById(req.params.id).exec();
    res.send(comment);
});
