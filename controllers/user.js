const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const { body, param, query } = require('express-validator');
const bcrypt = require('bcryptjs');
const { default: mongoose } = require('mongoose');
const validationMiddleware = require('../middleware/validation');
const {
    validatePaginationParams,
    validateImage
} = require('../utilities/validation');
const getAggregationPipeline = require('../utilities/pagination');
const {
    authenticate,
    authenticateAdmin
} = require('../middleware/authentication');
const Post = require('../models/post');
const Comment = require('../models/comment');
const fs = require('fs');
const { validatePostId } = require('./post.js');
const upload = require('../config/multer.js');
const {
    handleUpdateImage,
    handleUploadImage
} = require('../utilities/imageDB.js');

const validateId = () =>
    param('id').custom(async (value, { req }) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('invalid user id');
        }
        const user = await User.findById(value).exec();
        if (!user) {
            throw new Error('user not found');
        }
        req.targetUser = user;
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
    async (req, res, next) => {
        if (
            req.query.is_admin === undefined ||
            req.query.is_admin === true ||
            req.query.is_banned === undefined ||
            req.query.is_banned === true
        ) {
            return authenticateAdmin(req, res, next);
        }
        next();
    },
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
    body('name')
        .exists()
        .withMessage('You need to provide a name')
        .isString()
        .withMessage('name has to be a string')
        .trim()
        .isLength({ min: 1 })
        .withMessage('name must not be empty')
        .escape(),
    body('email')
        .exists()
        .withMessage('You need to provide an email')
        .isEmail()
        .withMessage('email is not in the correct format')
        .custom(async (value) => {
            const user = await User.findOne({ email: value }).exec();
            if (user) {
                throw new Error('email already in use');
            }
        })
        .escape()
        .toLowerCase(),
    body('password')
        .exists()
        .withMessage('You need to provide a password')
        .isString()
        .withMessage('password has to be a string')
        .isLength({
            min: 8
        })
        .withMessage('Password must contain at least 8 characters'),
    body('password-confirm')
        .exists()
        .withMessage('You need to provide a password confirm')
        .isString()
        .withMessage('password confirm has to be a string')
        .bail()
        .custom((value, { req }) => {
            return value === req.body.password;
        })
        .withMessage('Passwords do not match'),
    validationMiddleware,
    asyncHandler(async (req, res, next) => {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            is_admin: false,
            is_banned: false
        });

        try {
            await user.save();
        } catch (e) {
            if (e.name === 'ValidationError') {
                const errors = {};
                Object.keys(e.errors).forEach((key) => {
                    errors[key] = e.errors[key].message;
                });
                return res.status(400).send({ errors });
            }
            throw new Error("Internal server error: couldn't create the user");
        }
        res.status(200).send({
            message: 'User created successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
                is_banned: user.is_banned,
                is_admin: user.is_admin
            }
        });
    })
];

exports.user_detail = [
    validateId(),
    validationMiddleware,
    async (req, res, next) => {
        if (req.headers.authorization) {
            return authenticate(req, res, next);
        }
        next();
    },
    asyncHandler(async (req, res, next) => {
        let user;
        if (req.user && req.user._id.toString() === req.params.id) {
            user = await User.findById(
                req.params.id,
                'name email is_admin is_banned image saved_posts'
            ).populate({
                path: 'saved_posts',
                populate: [
                    {
                        path: 'author',
                        select: 'name'
                    }
                ]
            });
        } else {
            user = await User.findById(
                req.params.id,
                'name email is_admin is_banned image'
            );
        }
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
        const { _id, name, email, image, is_banned, is_admin } = user;
        res.send({
            message: 'User promoted successfully',
            user: { _id, name, email, image, is_banned, is_admin }
        });
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
        const { _id, name, email, image, is_banned, is_admin } = user;
        res.send({
            message: 'User promoted successfully',
            user: { _id, name, email, image, is_banned, is_admin }
        });
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
        const { _id, name, email, image, is_banned, is_admin } = user;
        res.send({
            message: 'User banned successfully',
            user: { _id, name, email, image, is_banned, is_admin }
        });
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
        const { _id, name, email, image, is_banned, is_admin } = user;
        res.send({
            message: 'User banned successfully',
            user: { _id, name, email, image, is_banned, is_admin }
        });
    })
];

exports.user_update_post = [
    validateId(),
    validationMiddleware,
    authenticate,
    upload.single('image'),
    body('name')
        .optional()
        .isString()
        .withMessage('name has to be a string')
        .trim()
        .isLength({ min: 1 })
        .withMessage('name must not be empty')
        .escape(),
    body('email')
        .optional()
        .isEmail()
        .withMessage('email is not in the correct format')
        .custom(async (value) => {
            const user = await User.findOne({ email: value }).exec();
            if (user) {
                throw new Error('Email is already in use');
            }
        })
        .escape()
        .toLowerCase(),
    body('oldPassword')
        .optional()
        .isString()
        .withMessage('oldPassword has to be a string')
        .trim()
        .isLength({
            min: 8
        })
        .withMessage('Password must contain at least 8 characters')
        .custom((value, { req }) => {
            return new Promise((resolve, reject) => {
                const user = req.targetUser;
                bcrypt.compare(value, user.password, (err, match) => {
                    if (err) {
                        reject(new Error("Couldn't compare passwords"));
                    }
                    if (!match) {
                        reject(new Error('Incorrect user password'));
                    }
                    resolve();
                });
            });
        }),
    body('newPassword')
        .optional()
        .isString()
        .withMessage('newPassword has to be a string')
        .trim()
        .isLength({
            min: 8
        })
        .withMessage('Password must contain at least 8 characters')
        .custom((value, { req }) => {
            if (value === req.body.oldPassword) {
                throw new Error('Enter a different password');
            }
            return true;
        }),
    body('passwords')
        .custom((value, { req }) => {
            return (
                (req.body.oldPassword && req.body.newPassword) ||
                (!req.body.newPassword && !req.body.oldPassword)
            );
        })
        .withMessage('Both passwords are required'),
    validateImage(),
    validationMiddleware,
    asyncHandler(async (req, res, next) => {
        if (!req.user.is_admin && req.user._id.toString() !== req.params.id) {
            return res
                .status(401)
                .send(
                    'Unauthorized to update user: only an admin or the user itself can do it'
                );
        }

        const image = req.file;
        const { name, email, oldPassword, newPassword } = req.body;
        if (!(name || email || oldPassword || newPassword || image)) {
            return res.status(400).send({
                error: "Can't update user: no values were provided"
            });
        }
        const user = req.targetUser;

        if (name) user.name = name;
        if (email) user.email = email;
        if (newPassword && oldPassword) user.password = newPassword;
        if (image) {
            const { data, error } = await handleUpdateImage(
                user.image,
                image,
                'profile.png'
            );
            if (error) {
                return res
                    .status(500)
                    .send("Internal server error: couldn't update user");
            } else user.image = data.path;
        }

        try {
            await user.save();
        } catch (e) {
            if (e.name === 'ValidationError') {
                const errors = {};
                Object.keys(e.errors).forEach((key) => {
                    errors[key] = e.errors[key].message;
                });
                return res.status(400).send({ errors });
            }
            throw new Error("Internal server error: couldn't update the user");
        }

        res.send({
            message: 'User updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
                is_banned: user.is_banned,
                is_admin: user.is_admin
            }
        });
    })
];

exports.user_save_post = [
    validatePostId(),
    validationMiddleware,
    authenticate,
    asyncHandler(async (req, res, next) => {
        const user = req.user;
        if (user.saved_posts.includes(req.targetPost._id)) {
            res.status(409).send({
                error: 'Cannot save post, the post is already saved'
            });
        }
        user.saved_posts.push(req.targetPost._id);
        await user.save();
        res.send({ message: 'Post saved successfully' });
    })
];

exports.user_unsave_post = [
    validatePostId(),
    authenticate,
    asyncHandler(async (req, res, next) => {
        const user = req.user;
        const postIndex = user.saved_posts.indexOf(req.targetPost._id);
        if (postIndex === -1) {
            return res.status(409).send({
                error: 'Cannot unsave post, the post is not saved'
            });
        }
        user.saved_posts.splice(postIndex, 1);

        await user.save();
        res.send({ message: 'Post unsaved successfully' });
    })
];

exports.user_check_saved_post = [
    validatePostId(),
    authenticate,
    asyncHandler(async (req, res, next) => {
        const isSaved = req.user.saved_posts.includes(req.params.id);
        res.send({
            isSaved
        });
    })
];
