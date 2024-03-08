const jwt = require('jsonwebtoken');
const User = require('../models/user');

async function authenticate(req, res, next) {
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
                req.user = user;
                next();
            } catch (e) {
                res.status(401).send('Invalid access token');
            }
        } catch (e) {
            res.status(401).send('Invalid refresh token');
        }
    }
}

module.exports = authenticate;
