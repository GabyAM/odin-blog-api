const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const mapErrors = require('../mappers/error');

const validationMiddleware = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorStatus = errors.array()[0].location === 'body' ? 400 : 404;
        res.status(errorStatus).send({
            errors: mapErrors(errors)
        });
    } else {
        next();
    }
});

module.exports = validationMiddleware;
