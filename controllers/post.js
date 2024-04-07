const asyncHandler = require('express-async-handler');
const Post = require('../models/post');
const { body, param } = require('express-validator');
const { default: mongoose } = require('mongoose');
const validationMiddleware = require('../middleware/validation');
const mapErrors = require('../mappers/error');
const requireBody = require('../middleware/bodyRequire');
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

const validateId = () =>
    param('id').custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('invalid post id');
        }
        const post = await Post.findById(value).exec();
        if (!post) {
            throw new Error('post not found');
        }
    });
exports.validatePostId = validateId;

exports.published_posts_list = [
    validatePaginationParams(),
    validationMiddleware,
    asyncHandler(async (req, res, next) => {
        const matchStage = {
            is_published: true
        };
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
        let posts = await Post.aggregate(
            getAggregationPipeline(req.query.limit, matchStage, sortStage)
        );
        posts = posts[0];
        res.send(posts);
    })
];

exports.unpublished_posts_list = [
    authenticate,
    validatePaginationParams(),
    validationMiddleware,
    asyncHandler(async (req, res, next) => {
        if (!req.user.is_admin) {
            res.status(401).send(
                'User is not authorized to perform this action'
            );
        }
        const matchStage = { is_published: false };
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
        let posts = await Post.aggregate(
            getAggregationPipeline(req.query.limit, matchStage, sortStage)
        );
        posts = posts[0];
        res.status(200).send(posts);
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
            authenticate(req, res, () => {
                if (!req.user.is_admin) {
                    res.status(401).send(
                        'User is not authorized to perform this action'
                    );
                } else {
                    res.send(post);
                }
            });
        }
    })
];

exports.post_create_post = [
    authenticateAdmin,
    parseFormData,
    body('title').optional({ values: 'falsy' }).escape(),
    body('summary').optional({ values: 'falsy' }).escape(),
    body('text').optional({ values: 'falsy' }).escape(),
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
    requireBody,
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

        await post.save();

        res.status(200).send({
            message: 'Post updated',
            post
        });
    })
];

exports.post_publish_post = [
    validateId(),
    validationMiddleware,
    authenticate,
    asyncHandler(async (req, res, next) => {
        try {
            const post = await Post.findById(req.params.id).exec();
            post.is_published = true;
            await post.save();
            res.send(post);
        } catch (e) {
            res.status(400).send({ errors: mapErrors(e) });
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
