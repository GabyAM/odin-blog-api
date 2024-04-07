const { authenticateAdmin } = require('../middleware/authentication');
const parseFormData = require('../middleware/parseFormData');
const { validateImage } = require('../utilities/validation');
const validationMiddleware = require('../middleware/validation');
const uploadImage = require('../middleware/fileUpload');

exports.upload_image = [
    authenticateAdmin,
    parseFormData,
    validateImage(),
    validationMiddleware,
    uploadImage,
    (req, res, next) => {
        res.status(200).send({ url: req.imageUrl });
    }
];
