const { handleUploadImage } = require('../utilities/imageDB');

const uploadImage = async (req, res, next) => {
    const image = req.file;
    if (image) {
        const { data, error } = await handleUploadImage(image);
        if (error) next(new Error('Failed to upload image'));
        req.imageUrl = data.path;
        next();
    } else {
        next();
    }
};

module.exports = uploadImage;
