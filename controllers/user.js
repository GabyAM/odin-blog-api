const asyncHandler = require('express-async-handler');
const User = require('../models/user');

exports.users_list = asyncHandler(async (req, res, next) => {
    const users = await User.find({}).exec();
    // res.set('Content-Type', 'application/json');
    res.send(users);
});
