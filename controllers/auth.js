const asyncHandler = require('express-async-handler');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const validationMiddleware = require('../middleware/validation');
const requireBody = require('../middleware/bodyRequire');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

exports.refresh = (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        res.status(401).send('Unable to refresh without refresh token');
    }
    try {
        const decodedRefreshToken = jwt.verify(
            refreshToken,
            'tokensecretchangelater'
        );
        const accessToken = jwt.sign(
            {
                id: decodedRefreshToken.id,
                name: decodedRefreshToken.name,
                email: decodedRefreshToken.email
            },
            'tokensecretchangelater',
            { expiresIn: '1m' }
        );
        res.send({ message: 'token refreshed', token: accessToken });
    } catch (e) {
        res.status(400).send('Invalid refresh token');
    }
};

exports.login = [
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
                res.status(401).send({ errors: { email: 'Incorrect email' } });
            }
            const match = await bcrypt.compare(
                req.body.password,
                user.password
            );
            if (!match) {
                res.status(401).send({
                    errors: { password: 'Incorrect password' }
                });
            }
            const accessToken = jwt.sign(
                { id: user._id, name: user.name, email: user.email },
                'tokensecretchangelater',
                { expiresIn: '1m' }
            );
            const refreshToken = jwt.sign(
                { id: user._id, name: user.name, email: user.email },
                'tokensecretchangelater',
                { expiresIn: '14 days' }
            );
            return res
                .status(200)
                .cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    sameSite: 'strict'
                })
                .send({ message: 'Auth passed', accessToken });
        } catch (e) {
            return res.status(500).send(e.message);
        }
    })
];
