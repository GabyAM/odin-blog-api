const jwt = require('jsonwebtoken');

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
