const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const { body, param, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
    body('passwordConfirm')
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
            res.status(400).send(e);
        }
    })
];

exports.user_login = [
    requireBody,
    body('email')
        .bail()
        .exists()
        .withMessage('You need to provide an email')
        .bail()
        .notEmpty()
        .withMessage('email cannot be empty')
        .bail()
        .isEmail()
        .withMessage('incorrect email format')
        .escape(),
    body('password')
        .bail()
        .exists()
        .withMessage('You need to provide a password')
        .bail()
        .isLength({ min: 8 })
        .withMessage('password must contain at least 8 characters')
        .escape(),
    validationMiddleware,
    asyncHandler(async (req, res, next) => {
        try {
            const user = await User.findOne({ email: req.body.email });
            if (!user) {
                res.status(404).send({ errors: { email: 'Incorrect email' } });
            }
            const match = await bcrypt.compare(
                req.body.password,
                user.password
            );
            if (!match) {
                res.status(404).send({
                    errors: { password: 'Incorrect password' }
                });
            }
            const token = jwt.sign(
                { id: user._id, name: user.name, email: user.email },
                'tokensecretchangelater',
                { expiresIn: '14 days' }
            );
            return res.status(200).send({ message: 'Auth passed', token });
        } catch (e) {
            return res.status(400).send(e.message);
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
