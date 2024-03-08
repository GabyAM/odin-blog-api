const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
    const accessToken = req.headers.authorization;
    const refreshToken = req.cookies.refreshToken;
    if (!(accessToken && refreshToken)) {
        res.status(401).send(
            'Both access token and refresh token are required'
        );
    }
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
            req.user = {
                id: decodedRefreshToken.id,
                name: decodedRefreshToken.name,
                email: decodedRefreshToken.email
            };
            next();
        } catch (e) {
            res.status(401).send('Invalid access token');
        }
    } catch (e) {
        res.status(401).send('Invalid refresh token');
    }
}

module.exports = authenticate;
