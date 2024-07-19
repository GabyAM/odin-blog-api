const asyncHandler = require('express-async-handler');
const Post = require('../models/post');
const Comment = require('../models/comment');
const { body, param, query } = require('express-validator');
const { default: mongoose } = require('mongoose');
const validationMiddleware = require('../middleware/validation');
const mapErrors = require('../mappers/error');
const {
    authenticate,
    authenticateAdmin
} = require('../middleware/authentication');
const getAggregationPipeline = require('../utilities/pagination');
const {
    validatePaginationParams,
    validateImage
} = require('../utilities/validation');
const sanitizeHtml = require('sanitize-html');
const uploadImage = require('../middleware/fileUpload');
const parseFormData = require('../middleware/parseFormData');
const fs = require('fs');
const User = require('../models/user');

const validateId = () =>
    param('id').custom(async (value, { req }) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('invalid post id');
        }
        const post = await Post.findById(value).exec();
        if (!post) {
            throw new Error('post not found');
        }
        req.targetPost = post;
    });
exports.validatePostId = validateId;

exports.posts_list = [
    validatePaginationParams(),
    validationMiddleware,
    query('is_published', 'The is_published parameter must be a boolean value')
        .optional()
        .isIn(['true', 'false'])
        .toBoolean(),
    validationMiddleware,
    async (req, res, next) => {
        if (!req.query.is_published || req.query.is_published === false) {
            return authenticateAdmin(req, res, next);
        }
        next();
    },
    asyncHandler(async (req, res, next) => {
        const matchStage = {};

        let searchStage = null;
        if (req.query.search) {
            searchStage = {
                index: 'posts_search',
                compound: {
                    should: [
                        {
                            autocomplete: {
                                query: req.query.search,
                                path: 'title'
                            }
                        },
                        {
                            autocomplete: {
                                query: req.query.search,
                                path: 'text'
                            }
                        },
                        {
                            autocomplete: {
                                query: req.query.search,
                                path: 'summary'
                            }
                        }
                    ],
                    minimumShouldMatch: 1
                }
            };
        }

        if (req.query.is_published !== undefined) {
            matchStage.is_published = req.query.is_published;
        }
        if (req.query.lastCreatedAt && req.query.lastId) {
            matchStage.$or = [
                { createdAt: { $lt: new Date(req.query.lastCreatedAt) } },
                {
                    createdAt: { $lt: new Date(req.query.lastCreatedAt) },
                    _id: { $gt: req.query.lastId }
                }
            ];
        }

        const sortStage = {
            createdAt: -1,
            _id: 1
        };

        const postsProjection = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                email: 1,
                                is_admin: 1,
                                is_banned: 1,
                                image: 1
                            }
                        }
                    ]
                }
            },
            { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } }
        ];
        let posts = await Post.aggregate(
            getAggregationPipeline(
                req.query.limit,
                searchStage,
                matchStage,
                sortStage,
                postsProjection
            )
        );
        posts = posts[0];
        res.send(posts);
    })
];

exports.post_detail = [
    validateId(),
    validationMiddleware,
    asyncHandler(async (req, res, next) => {
        const post = await Post.findById(req.params.id).exec();
        if (post.is_published) {
            res.send(post);
        } else {
            authenticateAdmin(req, res, () => {
                res.send(post);
            });
        }
    })
];

exports.post_create_post = [
    authenticateAdmin,
    parseFormData,
    body('title').optional({ values: 'falsy' }).escape(),
    body('summary').optional({ values: 'falsy' }).escape(),
    body('text')
        .optional({ values: 'falsy' })
        .customSanitizer((value) => {
            return sanitizeHtml(value, {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img'])
            });
        }),
    validateImage(),
    validationMiddleware,
    uploadImage,
    asyncHandler(async (req, res, next) => {
        const post = new Post({
            author: req.user._id,
            title: req.body.title || undefined,
            summary: req.body.summary || undefined,
            image: req.imageUrl || undefined,
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
    validateId(),
    validationMiddleware,
    authenticateAdmin,
    parseFormData,
    body('title').optional({ values: 'falsy' }).escape(),
    body('summary').optional({ values: 'falsy' }).escape(),
    body('text')
        .optional({ values: 'falsy' })
        .customSanitizer((value) => {
            return sanitizeHtml(value, {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img'])
            });
        }),
    validateImage(),
    validationMiddleware,
    uploadImage,
    asyncHandler(async (req, res, next) => {
        const { title, summary, text } = req.body;
        if (!(title || summary || text || req.imageUrl)) {
            return res
                .status(400)
                .send('Post not updated, no new fields were provided');
        }

        const post = await Post.findById(req.params.id).exec();
        post._id = req.params.id;
        if (title) post.title = title;
        if (summary) post.summary = req.body.summary;
        if (text) post.text = req.body.text;
        if (req.imageUrl) {
            if (post.image !== '/images/post_thumbnail_placeholder.png') {
                fs.unlink(`./public${post.image}`, (err) => {
                    if (err) throw new Error(err);
                });
            }
            post.image = req.imageUrl;
        }

        try {
            await post.save();
        } catch (e) {
            if (e.name === 'ValidationError') {
                const errors = {};
                Object.keys(e.errors).forEach((key) => {
                    errors[key] = e.errors[key].message;
                });
                return res.status(400).send({ errors });
            }
            throw new Error("Internal server error: couldn't publish the post");
        }

        res.status(200).send({
            message: 'Post updated',
            post
        });
    })
];

exports.post_delete_post = [
    validateId(),
    validationMiddleware,
    authenticateAdmin,
    asyncHandler(async (req, res, next) => {
        const db = mongoose.connection;
        const session = await db.startSession();
        try {
            await session.startTransaction();

            await Post.findByIdAndDelete(req.params.id).session(session);
            await Comment.deleteMany({ post: req.params.id }).session(session);
            await User.updateMany(
                { saved_posts: req.targetPost._id },
                { $pull: { saved_posts: req.targetPost._id } }
            ).session(session);
            await session.commitTransaction();
            session.endSession();
        } catch (e) {
            await session.abortTransaction();
            session.endSession();
            return res.status(500).send({
                error: "Internal server error: couldn't delete the post"
            });
        }
        res.status(200).send({ message: 'Post deleted successfully' });
    })
];

exports.post_publish_post = [
    validateId(),
    validationMiddleware,
    authenticateAdmin,
    asyncHandler(async (req, res, next) => {
        try {
            const post = await Post.findById(req.params.id).exec();
            if (post.is_published) {
                return res.status(409).send('Post is already published');
            }
            post.is_published = true;
            try {
                await post.save();
            } catch (e) {
                if (e.name === 'ValidationError') {
                    const errors = {};
                    Object.keys(e.errors).forEach((key) => {
                        errors[key] = e.errors[key].message;
                    });
                    return res.status(400).send({ errors });
                }
                throw new Error(
                    "Internal server error: couldn't publish the post"
                );
            }
            res.send({ message: 'post published successfully', post });
        } catch (e) {
            res.status(500).send({ error: e.message });
        }
    })
];

exports.post_unpublish_post = [
    validateId(),
    validationMiddleware,
    authenticateAdmin,
    asyncHandler(async (req, res, next) => {
        try {
            const post = await Post.findById(req.params.id).exec();
            if (!post.is_published) {
                return res.status(409).send('Post is already unpublished');
            }
            post.is_published = false;
            await post.save();
            res.send({ message: 'post unpublished successfully', post });
        } catch (e) {
            res.status(500).send({ error: e.message });
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
