const multer = require('multer');
const path = require('path');
const authenticate = require('../middleware/authentication');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '_' + file.originalname;
        cb(null, Math.round(Math.random() * 1e9) + '_' + uniqueSuffix);
    }
});

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp/;

        const extname = filetypes.test(
            path.extname(file.originalname).toLowerCase()
        );
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            req.fileValidationError = 'File is not compatible';
            cb(null, false);
        }
    }
});
exports.upload_image = [
    authenticate,
    upload.single('image'),
    function (req, res, next) {
        if (req.fileValidationError) {
            res.status(400).send(req.fileValidationError);
        }
        res.send({ url: `images/${req.file.filename}` });
    }
];
