const express = require('express');
const router = express.Router();
const user_controller = require('../controllers/user');
const post_controller = require('../controllers/post');

router.post('/', user_controller.user_create);

router.get('/:id', user_controller.user_detail);

router.get('/:id/posts', post_controller.user_posts);

router.post('/:id/promote', user_controller.user_promote_post);
router.post('/:id/demote', user_controller.user_demote_post);

router.post('/:id/ban', user_controller.user_ban_post);
router.post('/:id/unban', user_controller.user_unban_post);

router.post('/:id/delete', user_controller.user_delete_post);

module.exports = router;
