const { body } = require('express-validator');
const validationMiddleware = require('../middleware/validation');
const ErrorLog = require('../models/errorLog');

exports.log_error = [
    body('message')
        .exists()
        .withMessage('message is required')
        .isString()
        .withMessage('message has to be a string')
        .trim()
        .isLength({ min: 1 })
        .withMessage('message must not be empty'),
    body('stack')
        .exists()
        .withMessage('stack is required')
        .isString()
        .withMessage('stack has to be a string')
        .trim()
        .isLength({ min: 1 })
        .withMessage('message must not be empty'),
    validationMiddleware,
    async (req, res, next) => {
        const { origin } = req.headers;
        if (!origin) {
            return res.status(403).send({ message: 'Invalid origin' });
        }
        const { message, stack } = req.body;
        const error = new ErrorLog({ message, stack });
        try {
            await error.save();
            res.send({ message: 'error logged' });
        } catch (e) {
            res.status(500).send({ error: e.message });
        }
    }
];
