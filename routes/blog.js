const express = require('express');
const router = express.Router();
const user_controller = require('../controllers/user');
const post_controller = require('../controllers/post');
const comment_controller = require('../controllers/comment');

router.get('/users', user_controller.users_list);
router.get('/posts', post_controller.posts_list);
router.get('/comments', comment_controller.comments_list);
module.exports = router;
