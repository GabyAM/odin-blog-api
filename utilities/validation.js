const { body, query, params } = require('express-validator');
const { default: mongoose } = require('mongoose');

const validatePaginationParams = () => [
    query('lastCreatedAt')
        .optional({ values: 'falsy' })
        .isISO8601()
        .toDate()
        .withMessage('lastCreatedAt must be a date')
        .escape(),
    query('lastId')
        .optional({ values: 'falsy' })
        .custom(async (value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('invalid id');
            }
        })
        .escape(),
    query('limit')
        .default(10)
        .toInt()
        .isNumeric()
        .withMessage('limit has to be a number')
];

module.exports = validatePaginationParams;
