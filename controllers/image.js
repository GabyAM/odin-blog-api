const { authenticateAdmin } = require('../middleware/authentication');
const { validateImage } = require('../utilities/validation');
const validationMiddleware = require('../middleware/validation');
const uploadImage = require('../middleware/fileUpload');
const upload = require('../config/multer');

exports.upload_image = [
    authenticateAdmin,
    upload.single('image'),
    validateImage(true),
    validationMiddleware,
    uploadImage,
    (req, res, next) => {
        res.status(200).send({ url: req.imageUrl });
    }
];
