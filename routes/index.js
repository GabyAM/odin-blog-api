const express = require('express');
const router = express.Router();

const user_controller = require('../controllers/user');
const post_controller = require('../controllers/post');
const comment_controller = require('../controllers/comment');
const auth_controller = require('../controllers/auth');

router.get('/users', user_controller.users_list);
router.get('/published_posts', post_controller.published_posts_list);
router.get('/unpublished_posts', post_controller.unpublished_posts_list);
router.get('/comments', comment_controller.comments_list);

router.post('/login', auth_controller.login);
router.post('/refresh', auth_controller.refresh);
module.exports = router;
