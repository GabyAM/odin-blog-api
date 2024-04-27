const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const { body, param, query } = require('express-validator');
const bcrypt = require('bcryptjs');
const { default: mongoose } = require('mongoose');
const validationMiddleware = require('../middleware/validation');
const requireBody = require('../middleware/bodyRequire');
const { validatePaginationParams } = require('../utilities/validation');
const getAggregationPipeline = require('../utilities/pagination');
const {
    authenticate,
    authenticateAdmin
} = require('../middleware/authentication');
const Post = require('../models/post');
const Comment = require('../models/comment');

const validateId = () =>
    param('id').custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('invalid user id');
        }
        const user = await User.findById(value).exec();
        if (!user) {
            throw new Error('user not found');
        }
    });

exports.users_list = [
    validatePaginationParams(),
    validationMiddleware,
    query('is_admin', 'The is_admin parameter must be a boolean value')
        .optional()
        .isIn(['true', 'false'])
        .toBoolean(),
    query('is_banned', 'The is_admin parameter must be a boolean value')
        .optional()
        .isIn(['true', 'false'])
        .toBoolean(),
    validationMiddleware,
    asyncHandler(async (req, res, next) => {
        let searchStage = null;
        if (req.query.search) {
            searchStage = {
                index: 'users_search',
                compound: {
                    should: [
                        {
                            autocomplete: {
                                query: req.query.search,
                                path: 'name'
                            }
                        },
                        {
                            autocomplete: {
                                query: req.query.search,
                                path: 'email'
                            }
                        }
                    ],
                    minimumShouldMatch: 1
                }
            };
        }

        const matchStage = {};
        if (req.query.is_admin !== undefined) {
            matchStage.is_admin = req.query.is_admin;
        }
        if (req.query.is_banned !== undefined) {
            matchStage.is_banned = req.query.is_banned;
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

        const usersProjection = [
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
        ];

        let users = await User.aggregate(
            getAggregationPipeline(
                req.query.limit,
                searchStage,
                matchStage,
                sortStage,
                usersProjection
            )
        );
        users = users[0];
        res.send(users);
    })
];

exports.user_create = [
    requireBody,
    body('name')
        .bail()
        .exists()
        .withMessage('You need to provide a name')
        .bail()
        .notEmpty()
        .withMessage('name must not be empty')
        .escape(),
    body('email')
        .bail()
        .exists()
        .withMessage('You need to provide an email')
        .bail()
        .isEmail()
        .withMessage('email is not in the correct format')
        .custom(async (value) => {
            const user = await User.findOne({ email: value }).exec();
            if (user) {
                throw new Error('email already in use');
            }
        })
        .escape(),
    body('password')
        .bail()
        .exists()
        .withMessage('You need to provide a password')
        .bail()
        .isLength({
            min: 5
        })
        .withMessage('Password must contain at least 8 characters')
        .escape(),
    body('password-confirm')
        .bail()
        .exists()
        .withMessage('You need to provide a password confirm')
        .bail()
        .custom((value, { req }) => {
            return value === req.body.password;
        })
        .withMessage('Passwords do not match')
        .escape(),
    validationMiddleware,
    asyncHandler(async (req, res, next) => {
        try {
            bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
                if (err) {
                    throw new Error(err);
                }
                const user = new User({
                    name: req.body.name,
                    email: req.body.email,
                    password: hashedPassword,
                    is_admin: false
                });

                await user.save();
                res.status(200).send(user);
            });
        } catch (e) {
            res.status(500).send(e);
        }
    })
];

exports.user_detail = [
    param('id').custom(async (value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('invalid user id');
        }
        const post = await User.findById(value).exec();
        if (!post) {
            throw new Error('user not found');
        }
    }),
    validationMiddleware,
    asyncHandler(async (req, res, next) => {
        const user = await User.findById(
            req.params.id,
            'name email is_admin image'
        );
        res.send(user);
    })
];

exports.user_delete_post = [
    validateId(),
    validationMiddleware,
    authenticate,
    asyncHandler(async (req, res, next) => {
        if (!req.user.is_admin && req.user._id !== req.params.id) {
            res.status(401).send({
                message:
                    'Unauthorized to delete this user. Only an admin or the user itself can do it.'
            });
        }
        const user = await User.findById(req.params.id);
        const db = mongoose.connection;
        const session = await db.startSession();
        try {
            await session.startTransaction();

            const posts = await Post.find(
                { author: user._id },
                { _id: 1 }
            ).session(session);
            posts.forEach(async (post) => {
                await Comment.deleteMany({ post: post._id }).session(session);
                await Post.findByIdAndDelete(post._id).session(session);
            });
            await Comment.updateMany(
                { user: user._id },
                { $set: { user: null, text: '' } }
            ).session(session);
            await User.findByIdAndDelete(req.params.id);

            await session.commitTransaction();
        } catch (e) {
            console.log(e);
            await session.abortTransaction();
            session.endSession();
            return res.status(500).send({
                message: "Internal server error: couldn't delete the user"
            });
        }
        res.send({ message: 'User deleted successfully' });
    })
];

exports.user_promote_post = [
    validateId(),
    validationMiddleware,
    authenticateAdmin,
    asyncHandler(async (req, res, next) => {
        const user = await User.findById(req.params.id);
        if (user.is_admin) {
            res.status(409).send({
                message: 'User cannot be promoted since its already an admin'
            });
        }
        user.is_admin = true;
        await user.save();
        res.send({ message: 'User promoted successfully' });
    })
];

exports.user_demote_post = [
    validateId(),
    validationMiddleware,
    authenticateAdmin,
    asyncHandler(async (req, res, next) => {
        const user = await User.findById(req.params.id);
        if (!user.is_admin) {
            res.status(409).send({
                message:
                    'User cannot be demoted since its already a regular user'
            });
        }
        user.is_admin = false;
        await user.save();
        res.send({ message: 'User promoted successfully' });
    })
];

exports.user_ban_post = [
    validateId(),
    validationMiddleware,
    authenticateAdmin,
    asyncHandler(async (req, res, next) => {
        const user = await User.findById(req.params.id);
        if (user.is_banned) {
            res.status(409).send({
                message: 'User cannot be banned since is already banned'
            });
        }
        user.is_admin = false;
        user.is_banned = true;
        await user.save();
        res.send({ message: 'User banned successfully' });
    })
];

exports.user_unban_post = [
    validateId(),
    validationMiddleware,
    authenticateAdmin,
    asyncHandler(async (req, res, next) => {
        const user = await User.findById(req.params.id);
        if (!user.is_banned) {
            res.status(409).send({
                message: 'User cannot be unbanned since is not banned'
            });
        }
        user.is_banned = false;
        await user.save();
        res.send({ message: 'User banned successfully' });
    })
];
