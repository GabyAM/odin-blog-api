const asyncHandler = require('express-async-handler');
const Comment = require('../models/comment');

exports.comments_list = asyncHandler(async (req, res, next) => {
    const comments = await Comment.find({}).exec();
    res.send(comments);
});

exports.comment_detail = asyncHandler(async (req, res, next) => {
    const comment = await Comment.findById(req.params.id)
        .populate({
            path: 'user',
            select: 'first_name last_name email is_admin'
        })
        .exec();
    res.send(comment);
});
exports.post_comments = asyncHandler(async (req, res, next) => {
    const comments = await Comment.find(
        {
            post: req.params.id,
            parent_comment: null
        },
        'user text comments createdAt'
    )
        .populate({
            path: 'user',
            select: 'first_name last_name email is_admin'
        })
        .populate({
            path: 'comments',
            select: 'user text comments createdAt',
            populate: [
                {
                    path: 'comments',
                    select: 'user text createdAt comments url',
                    populate: {
                        path: 'user',
                        select: 'first_name last_name email is_admin'
                    }
                },
                { path: 'user', select: 'first_name last_name email is_admin' }
            ]
        })
        .exec();

    res.send(comments);
});
