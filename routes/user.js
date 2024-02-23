const express = require('express');
const router = express.Router();
const user_controller = require('../controllers/user');
const post_controller = require('../controllers/post');

router.post('/', user_controller.user_create);

router.post('/login', user_controller.user_login);

router.get('/:id', user_controller.user_detail);

router.get('/:id/posts', post_controller.user_posts);

module.exports = router;
