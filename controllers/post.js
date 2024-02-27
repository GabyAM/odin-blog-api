const asyncHandler = require('express-async-handler');
const Post = require('../models/post');
const { body, validationResult } = require('express-validator');
const passport = require('../passport');

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

exports.post_create_post = [
    body('title')
        .trim()
        .isLength({ min: 10 })
        .withMessage('title should have at least 10 characters')
        .custom(async (value) => {
            const post = await Post.findOne({ title: value }).exec();
            if (post) {
                throw new Error('Post name already in use');
            }
        })
        .escape(),
    body('summary', 'summary should not be empty').trim().notEmpty().escape(),
    body('text', 'text should not be empty').trim().notEmpty().escape(),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send(errors);
        }
        next();
    }),
    passport.authenticate('jwt', { session: false }),
    asyncHandler(async (req, res, next) => {
        if (!req.user.is_admin) {
            res.status(400).send(
                'user is not authorized to perform this action'
            );
        }

        const post = new Post({
            title: req.body.title,
            author: req.user._id,
            summary: req.body.title,
            text: req.body.text
        });

        await post.save();
        res.status(200).send({
            message: 'Post created',
            post
        });
    })
];

exports.user_posts = asyncHandler(async (req, res, next) => {
    const posts = await Post.find(
        { author: req.params.id },
        'title summary'
    ).exec();
    res.send(posts);
});
