const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const { body, param } = require('express-validator');
const bcrypt = require('bcryptjs');
const { default: mongoose } = require('mongoose');
const validationMiddleware = require('../middleware/validation');
const requireBody = require('../middleware/bodyRequire');

exports.users_list = asyncHandler(async (req, res, next) => {
    const users = await User.find({}, 'name email is_admin').exec();
    res.send(users);
});

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
        const user = await User.findById(req.params.id, 'name email is_admin');
        res.send(user);
    })
];
