const fs = require('fs');
const path = require('path');

const uploadImage = (req, res, next) => {
    const image = req.body.image;
    if (image) {
        const imageUrl = `/images/${Date.now()}_${Math.round(Math.random() * 1e9)}${path.extname(image.originalFilename)}`;
        const imagePath = image._writeStream.path;
        fs.readFile(imagePath, (err, data) => {
            if (err) {
                next(err);
                return;
            }
            fs.writeFile(`./public${imageUrl}`, data, (err) => {
                if (err) {
                    next(err);
                }
                req.imageUrl = imageUrl;
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        next(err);
                    }
                    next();
                });
            });
        });
    } else {
        next();
    }
};

module.exports = uploadImage;
