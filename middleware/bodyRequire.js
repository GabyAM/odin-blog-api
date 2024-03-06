const requireBody = (req, res, next) => {
    if (!req.body) {
        res.status(400).send({
            errors: { body: 'You need to provide a body in the request' }
        });
    } else {
        next();
    }
};

module.exports = requireBody;
