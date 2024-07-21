const formidable = require('formidable');

const parseFormData = (req, res, next) => {
    if (!req.headers['content-type'].startsWith('multipart/form-data')) {
        return res.status(400).send({
            error: 'Invalid content type, please send the data in a multipart/form-data format'
        });
    }
    const form = new formidable.IncomingForm({ multiples: false });

    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }
        const mappedFields = {};
        Object.keys(fields).forEach((key) => {
            mappedFields[key] = fields[key][0];
        });
        Object.keys(files).forEach((key) => {
            mappedFields[key] = files[key][0];
        });
        req.body = { ...mappedFields };
        next();
    });
};

module.exports = parseFormData;
