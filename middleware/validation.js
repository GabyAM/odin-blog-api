const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const mapErrors = require('../mappers/error');

const validationMiddleware = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).send({ errors: mapErrors(errors) });
    } else {
        next();
    }
});

module.exports = validationMiddleware;
