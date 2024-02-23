const asyncHandler = require('express-async-handler');
const Comment = require('../models/comment');
const { body, param, validationResult } = require('express-validator');
const passport = require('../passport');
const Post = require('../models/post');
const { default: mongoose } = require('mongoose');

exports.comments_list = asyncHandler(async (req, res, next) => {
    const comments = await Comment.find({}).exec();
    res.send(comments);
});

exports.comment_detail = asyncHandler(async (req, res, next) => {
    const comment = await Comment.findById(req.params.id)
        .populate({
            path: 'user',
            select: 'name email is_admin'
        })
        .exec();
    res.send(comment);
});

exports.post_comment_create_post = [
    param('id').custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('invalid post id');
        }
        const post = await Post.findById(value).exec();
        if (!post) {
            throw new Error('post not found');
        }
    }),
    body('text', 'comment cannot be empty').notEmpty().escape(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send(errors);
        }
        next();
    }),
    passport.authenticate('jwt', { session: false }),
    asyncHandler(async (req, res, next) => {
        const comment = new Comment({
            user: req.user._id,
            post: req.params.id,
            text: req.body.text
        });

        await comment.save();
        res.status(200).send({
            message: 'comment created',
            comment
        });
    })
];

exports.post_comment_count = asyncHandler(async (req, res, next) => {
    const commentCount = await Comment.countDocuments({ post: req.params.id });
    res.send({ count: commentCount });
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
            select: 'name email is_admin'
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
                        select: 'name email is_admin'
                    }
                },
                { path: 'user', select: 'name email is_admin' }
            ]
        })
        .exec();

    res.send(comments);
});
