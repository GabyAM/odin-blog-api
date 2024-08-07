const { body, query, params } = require('express-validator');
const { default: mongoose } = require('mongoose');
const path = require('path');

exports.validatePaginationParams = () => [
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

exports.validateImage = (required = false) => [
    body('image').custom((value, { req }) => {
        if (!required && !req.file) return true;
        if (!req.file) throw new Error('Image is required');

        const file = req.file;
        const filetypes = /jpeg|jpg|png|gif|webp/;

        const extname = filetypes.test(
            path.extname(file.originalname).toLowerCase()
        );
        const mimetype = filetypes.test(file.mimetype);

        if (!(extname && mimetype)) {
            throw new Error('Invalid file format');
        }
        if (!(file.size < 1024 * 1024 * 5)) {
            throw new Error('Max file size exceeded');
        }
        return true;
    })
];
