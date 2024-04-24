const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.authenticate = async function (req, res, next) {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const refreshToken = req.cookies.refreshToken;
    if (!(accessToken && refreshToken)) {
        res.status(401).send(
            'Both access token and refresh token are required'
        );
    } else {
        try {
            const decodedRefreshToken = jwt.verify(
                refreshToken,
                'tokensecretchangelater'
            );
            try {
                const decodedAccessToken = jwt.verify(
                    accessToken,
                    'tokensecretchangelater'
                );

                const user = await User.findById(decodedAccessToken.id);
                if (!user) {
                    res.status(404).send('User not found');
                }
                if (user.is_banned) {
                    res.status(403).send('Not authorized, user is banned');
                }
                req.user = user;
                next();
            } catch (e) {
                res.status(401).send('Invalid access token');
            }
        } catch (e) {
            res.status(401).send('Invalid refresh token');
        }
    }
};

exports.authenticateAdmin = async function (req, res, next) {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const refreshToken = req.cookies.refreshToken;
    if (!(accessToken && refreshToken)) {
        res.status(401).send(
            'Both access token and refresh token are required'
        );
    } else {
        try {
            const decodedRefreshToken = jwt.verify(
                refreshToken,
                'tokensecretchangelater'
            );
            try {
                const decodedAccessToken = jwt.verify(
                    accessToken,
                    'tokensecretchangelater'
                );

                const user = await User.findById(decodedAccessToken.id);
                if (!user) {
                    res.status(404).send('User not found');
                }
                if (user.is_banned) {
                    res.status(403).send('Not authorized, user is banned');
                }
                if (!user.is_admin) {
                    res.status(401).send(
                        'User is not authorized to perform this action'
                    );
                }
                req.user = user;
                next();
            } catch (e) {
                res.status(401).send('Invalid access token');
            }
        } catch (e) {
            res.status(401).send('Invalid refresh token');
        }
    }
};
