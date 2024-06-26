const express = require('express');
const router = express.Router();

const user_controller = require('../controllers/user');
const post_controller = require('../controllers/post');
const comment_controller = require('../controllers/comment');
const auth_controller = require('../controllers/auth');
const image_controller = require('../controllers/image');

router.get('/users', user_controller.users_list);
router.get('/posts', post_controller.posts_list);
router.get('/comments', comment_controller.comments_list);

router.post('/login', auth_controller.login);
router.post('/refresh', auth_controller.refresh);

router.post('/image/upload', image_controller.upload_image);
module.exports = router;
