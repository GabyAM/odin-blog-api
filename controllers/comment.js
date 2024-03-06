const asyncHandler = require('express-async-handler');
const Comment = require('../models/comment');
const { body, param, validationResult } = require('express-validator');
const passport = require('../passport');
const Post = require('../models/post');
const { default: mongoose } = require('mongoose');
const validationMiddleware = require('../middleware/validation');
const { validatePostId } = require('./post.js');

const validateId = () =>
    param('id').custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('invalid comment id');
        }
        const comment = await Comment.findById(value).exec();
        if (!comment) {
            throw new Error('comment not found');
        }
    });

exports.comments_list = asyncHandler(async (req, res, next) => {
    const comments = await Comment.find({}).exec();
    res.send(comments);
});

exports.comment_detail = [
    validateId(),
    validationMiddleware,
    asyncHandler(async (req, res, next) => {
        try {
            const comment = await Comment.findById(req.params.id)
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
            res.send(comment);
        } catch (e) {
            res.status(500).send(e);
        }
    })
];

exports.post_comment_create_post = [
    param('id').custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('invalid comment id');
        }
    }),
    validationMiddleware,
    body('text')
        .bail()
        .exists()
        .withMessage('You need to provide a text')
        .bail()
        .notEmpty()
        .withMessage('comment cannot be empty')
        .escape(),
    validationMiddleware,
    passport.authenticate('jwt', { session: false }),
    asyncHandler(async (req, res, next) => {
        const post = await Post.findById(req.params.id).exec();
        if (!post) {
            res.status(404).send('post not found');
        }

        const comment = new Comment({
            user: req.user._id,
            post: req.params.id,
            text: req.body.text
        });

        await comment.save();

        post.comment_count++;
        await post.save();

        res.status(200).send({
            message: 'comment created',
            comment
        });
    })
];

exports.comment_update_post = [
    validateId(),
    validationMiddleware,
    body('text', 'comment cannot be empty').trim().notEmpty().escape(),
    validationMiddleware,
    passport.authenticate('jwt', { session: false }),
    asyncHandler(async (req, res, next) => {
        const oldComment = await Comment.findById(req.params.id).exec();
        if (oldComment.user.toString() !== req.user.id) {
            res.status(403).send('Cannot edit comments from other users');
        } else {
            const comment = new Comment({
                _id: req.params.id,
                user: oldComment.user,
                text: req.body.text,
                parent_comment: oldComment.parent_comment,
                comments: oldComment.comments
            });

            await Comment.findByIdAndUpdate(comment._id, comment, {});
            res.status(200).send({
                message: 'Comment updated',
                comment
            });
        }
    })
];

exports.post_comment_count = [
    validatePostId(),
    validationMiddleware,
    asyncHandler(async (req, res, next) => {
        const commentCount = await Comment.countDocuments({
            post: req.params.id
        });
        res.send({ count: commentCount });
    })
];

exports.post_comments = [
    validatePostId(),
    validationMiddleware,
    asyncHandler(async (req, res, next) => {
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
    })
];
