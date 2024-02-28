const asyncHandler = require('express-async-handler');
const Post = require('../models/post');
const { body, param, validationResult } = require('express-validator');
const passport = require('../passport');
const { default: mongoose } = require('mongoose');

exports.published_posts_list = asyncHandler(async (req, res, next) => {
    const posts = await Post.find({ is_published: true })
        .sort({ createdAt: -1 })
        .exec();

    res.send(posts);
});

exports.unpublished_posts_list = [
    passport.authenticate('jwt', { session: false }),
    asyncHandler(async (req, res, next) => {
        if (!req.user.is_admin) {
            res.status(401).send(
                'User is not authorized to perform this action'
            );
        }
        const posts = await Post.find({ is_published: false })
            .sort({ createdAt: -1 })
            .exec();
        res.status(200).send(posts);
    })
];

exports.post_detail = [
    param('id').custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('invalid id');
        }
        const post = await Post.findById(value).exec();
        if (!post) {
            throw new Error('post not found');
        }
    }),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send(errors);
        } else {
            const post = await Post.findById(req.params.id)
                .exec()
                .catch((e) => {
                    res.status(400).send(e);
                });
            if (post.is_published) {
                res.send(post);
            } else {
                passport.authenticate(
                    'jwt',
                    { session: false },
                    function (err, user) {
                        if (err) {
                            res.status(400).send(err);
                        } else if (!user || !user.is_admin) {
                            res.status(401).send(
                                'User is not authorized to perform this action'
                            );
                        } else res.send(post);
                    }
                )(req, res, next);
            }
        }
    })
];

exports.post_create_post = [
    passport.authenticate('jwt', { session: false }),
    asyncHandler(async (req, res, next) => {
        if (!req.user.is_admin) {
            res.status(400).send(
                'user is not authorized to perform this action'
            );
        }

        const post = new Post({
            author: req.user._id,
            title: req.body.title || undefined,
            summary: req.body.summary || undefined,
            text: req.body.text || undefined
        });

        await post.save();
        res.status(200).send({
            message: 'Post created',
            post
        });
    })
];

exports.post_update_post = [
    body('title', 'title is required').exists().escape(),
    body('summary', 'summary is required').exists().escape(),
    body('text', 'text is required').exists().escape(),
    param('id').custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('invalid id');
        }
        const post = await Post.findById(value).exec();
        if (!post) {
            throw new Error('Post not found');
        }
    }),
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
            _id: req.params.id,
            title: req.body.title,
            author: req.user._id,
            summary: req.body.summary,
            text: req.body.text
        });

        await post.findByIdAndUpdate(post._id, post, {});
        res.status(200).send({
            message: 'Post updated',
            post
        });
    })
];

exports.post_publish_post = [
    param('id').custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('invalid id');
        }
        const post = await Post.findById(value).exec();
        if (!post) {
            throw new Error('post not found');
        }
    }),
    passport.authenticate('jwt', { session: false }),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send(errors);
        } else {
            try {
                const post = await Post.findById(req.params.id).exec();
                post.is_published = true;
                await post.save();
                res.send(post);
            } catch (e) {
                res.status(400).send(e);
            }
        }
    })
];

exports.user_posts = asyncHandler(async (req, res, next) => {
    const posts = await Post.find(
        { author: req.params.id },
        'title summary'
    ).exec();
    res.send(posts);
});
