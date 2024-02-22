const asyncHandler = require('express-async-handler');
const User = require('../models/user');

exports.users_list = asyncHandler(async (req, res, next) => {
    const users = await User.find({}).exec();
    res.send(users);
});

exports.user_detail = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    res.send(user);
});
