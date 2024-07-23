const { decode } = require('base64-arraybuffer');
const path = require('path');
const supabase = require('../config/supabase');

const handleUploadImage = async (imageFile) => {
    const imageName = `${Date.now()}_${Math.round(Math.random() * 1e9)}${path.extname(imageFile.originalname)}`;
    const imageBase64 = decode(imageFile.buffer.toString('base64'));
    const { data, error } = await supabase.storage
        .from('images')
        .upload(imageName, imageBase64, {
            contentType: imageFile.mimetype
        });
    return { data, error };
};

const handleReplaceImage = async (prevImageUrl, newImageFile) => {
    const imageBase64 = decode(newImageFile.buffer.toString('base64'));

    const { data, error } = await supabase.storage
        .from('images')
        .update(prevImageUrl, imageBase64, {
            contentType: newImageFile.mimetype
        });

    return { data, error };
};

const handleUpdateImage = async (prevImage, newImage, placeholderImage) => {
    let result;
    if (placeholderImage && prevImage === placeholderImage) {
        result = await handleUploadImage(newImage);
    } else {
        result = await handleReplaceImage(prevImage, newImage);
    }
    return result;
};

module.exports = { handleUploadImage, handleUpdateImage };
