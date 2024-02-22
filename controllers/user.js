const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

exports.users_list = asyncHandler(async (req, res, next) => {
    const users = await User.find({}, 'name email is_admin').exec();
    res.send(users);
});

exports.user_create = [
    body('name', 'name must not be empty').notEmpty().escape(),
    body('email')
        .isEmail()
        .withMessage('email is not in the correct format')
        .custom(async (value) => {
            const user = await User.findOne({ email: value }).exec();
            if (user) {
                throw new Error('email already in use');
            }
        })
        .escape(),
    body('password', 'Password must contain at least 8 characters')
        .isLength({
            min: 5
        })
        .escape(),
    body('passwordConfirm')
        .custom((value, { req }) => {
            return value === req.body.password;
        })
        .withMessage('Passwords do not match')
        .escape(),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send(errors);
        } else {
            try {
                bcrypt.hash(
                    req.body.password,
                    10,
                    async (err, hashedPassword) => {
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
                    }
                );
            } catch (e) {
                return next(e);
            }
        }
    })
];

exports.user_detail = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id, 'name email is_admin');

    res.send(user);
});
