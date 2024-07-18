const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const errorLogSchema = new Schema(
    {
        message: { type: String, required: true },
        stack: { type: String, required: true }
    },
    { timestamps: true }
);

const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);
module.exports = ErrorLog;
