const asyncHandler = require('express-async-handler');
const Comment = require('../models/comment');
const { body, param, validationResult } = require('express-validator');
const Post = require('../models/post');
const { default: mongoose } = require('mongoose');
const validationMiddleware = require('../middleware/validation');
const { validatePostId } = require('./post.js');
const {
    authenticate,
    authenticateAdmin
} = require('../middleware/authentication.js');
const getAggregationPipeline = require('../utilities/pagination.js');
const { validatePaginationParams } = require('../utilities/validation.js');

const validateId = () =>
    param('id').custom(async (value, { req }) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('invalid comment id');
        }
        const comment = await Comment.findById(value).exec();
        if (!comment) {
            throw new Error('comment not found');
        }
        req.targetComment = comment;
    });

exports.comments_list = [
    validatePaginationParams(),
    validationMiddleware,
    asyncHandler(async (req, res, next) => {
        let searchStage = null;
        if (req.query.search) {
            searchStage = {
                index: 'comments_search',
                compound: {
                    should: [
                        {
                            autocomplete: {
                                path: 'text',
                                query: req.query.search
                            }
                        }
                    ],
                    minimumShouldMatch: 1
                }
            };
        }
        const matchStage = {};
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
        const resultsProjection = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user',
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
            {
                $lookup: {
                    from: 'posts',
                    localField: 'post',
                    foreignField: '_id',
                    as: 'post',
                    pipeline: [
                        {
                            $project: {
                                title: 1
                            }
                        }
                    ]
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            { $addFields: { user: { $ifNull: ['$user', null] } } },
            { $unwind: '$post' }
        ];
        let comments = await Comment.aggregate(
            getAggregationPipeline(
                req.query.limit,
                searchStage,
                matchStage,
                sortStage,
                resultsProjection
            )
        );

        comments = comments[0];

        res.send(comments);
    })
];

exports.comment_detail = [
    validateId(),
    validationMiddleware,
    asyncHandler(async (req, res, next) => {
        try {
            const comment = await Comment.findById(req.params.id)
                .populate({
                    path: 'user',
                    select: 'name email is_admin is_banned image'
                })
                .populate({
                    path: 'post',
                    select: 'title summary image'
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
    authenticate,
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
    authenticate,
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

exports.comment_delete_post = [
    validateId(),
    validationMiddleware,
    authenticate,
    asyncHandler(async (req, res, next) => {
        const comment = await Comment.findById(req.params.id).populate('user');

        if (!req.user.is_admin && req.user._id !== comment.user._id) {
            res.status(401).send(
                'User is not authorized to perform this action'
            );
        } else {
            async function deleteCommentAndReplies(commentId, session) {
                const comment =
                    await Comment.findById(commentId).session(session);
                comment.comments.forEach(async (reply) => {
                    await deleteCommentAndReplies(reply, session);
                });

                await Comment.findByIdAndDelete(commentId).session(session);
            }

            const db = mongoose.connection;
            const session = await db.startSession();
            try {
                await session.startTransaction();

                comment.comments.forEach(async (replyId) => {
                    await deleteCommentAndReplies(replyId, session);
                });
                await Comment.findByIdAndDelete(comment._id).session(session);

                await session.commitTransaction();
                session.endSession();
            } catch (e) {
                await session.abortTransaction();
                session.endSession();
                return res.status(500).send({
                    message: "Internal server error: couldn't delete comment"
                });
            }

            res.status(200).send({
                message: 'Comment deleted successfully'
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
    validatePaginationParams(),
    validationMiddleware,
    asyncHandler(async (req, res, next) => {
        const matchStage = {
            post: new mongoose.Types.ObjectId(req.params.id),
            parent_comment: null
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
        const resultsProjection = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user',
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
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            { $addFields: { user: { $ifNull: ['$user', null] } } }
        ];

        let comments = await Comment.aggregate(
            getAggregationPipeline(
                req.query.limit,
                null,
                matchStage,
                sortStage,
                resultsProjection
            )
        );

        comments = comments[0];

        res.send(comments);
    })
];

exports.comment_replies = [
    validateId(),
    validatePaginationParams(),
    validationMiddleware,
    asyncHandler(async (req, res, next) => {
        const matchStage = {
            parent_comment: req.targetComment._id
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

        const resultsProjection = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user',
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
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            { $addFields: { user: { $ifNull: ['$user', null] } } }
        ];

        let comments = await Comment.aggregate(
            getAggregationPipeline(
                req.query.limit,
                null,
                matchStage,
                sortStage,
                resultsProjection
            )
        );

        comments = comments[0];

        res.send(comments);
    })
];
