const express = require('express');
const router = express.Router();
const user_controller = require('../controllers/user');
const post_controller = require('../controllers/post');
const comment_controller = require('../controllers/comment');

router.get('/users', user_controller.users_list);
router.get('/posts', post_controller.posts_list);
router.get('/comments', comment_controller.comments_list);

router.get('/post/:id', post_controller.post_detail);
router.get('/user/:id', user_controller.user_detail);
router.get('/comment/:id', comment_controller.comment_detail);
module.exports = router;
