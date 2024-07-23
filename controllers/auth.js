const asyncHandler = require('express-async-handler');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const validationMiddleware = require('../middleware/validation');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

exports.refresh = async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).send('Unable to refresh without refresh token');
    }
    try {
        const decodedRefreshToken = jwt.verify(
            refreshToken,
            process.env.AUTH_TOKEN_SECRET
        );
        let user;
        try {
            user = await User.findById(decodedRefreshToken.id);
        } catch (e) {
            return res
                .status(500)
                .send('Something went wrong while refreshing');
        }
        if (!user || user.is_banned) {
            return res
                .status(401)
                .send("The user doesn't exist or is not allowed");
        }
        const accessToken = jwt.sign(
            {
                id: user._id,
                name: user.name,
                email: user.email,
                image: user.image
            },
            process.env.AUTH_TOKEN_SECRET,
            { expiresIn: '5m' }
        );
        res.send({ message: 'token refreshed', accessToken });
    } catch (e) {
        res.status(400).send('Invalid refresh token');
    }
};

exports.login = [
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
        .escape()
        .toLowerCase(),
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
                return res
                    .status(401)
                    .send({ errors: { email: 'Incorrect email' } });
            }
            const match = await bcrypt.compare(
                req.body.password,
                user.password
            );
            if (!match) {
                return res.status(401).send({
                    errors: { password: 'Incorrect password' }
                });
            }
            const accessToken = jwt.sign(
                {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    image: user.image
                },
                process.env.AUTH_TOKEN_SECRET,
                { expiresIn: '5m' }
            );
            const refreshToken = jwt.sign(
                {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    image: user.image
                },
                process.env.AUTH_TOKEN_SECRET,
                { expiresIn: '14 days' }
            );
            return res
                .status(200)
                .cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    path: '/'
                })
                .send({ message: 'Auth passed', accessToken });
        } catch (e) {
            return res.status(500).send({ error: e.message });
        }
    })
];
