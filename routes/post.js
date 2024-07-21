const express = require('express');
const router = express.Router();

const post_controller = require('../controllers/post');
const comment_controller = require('../controllers/comment');
const user_controller = require('../controllers/user');

router.post('/', post_controller.post_create_post);
router.get('/:id', post_controller.post_detail);

router.post('/:id/update', post_controller.post_update_post);
router.post('/:id/delete', post_controller.post_delete_post);
router.post('/:id/publish', post_controller.post_publish_post);
router.post('/:id/unpublish', post_controller.post_unpublish_post);
router.get('/:id/comments', comment_controller.post_comments);
router.post('/:id/comments', comment_controller.post_comment_create_post);
router.get('/:id/comments/count', comment_controller.post_comment_count);
router.post('/:id/save', user_controller.user_save_post);
router.post('/:id/unsave', user_controller.user_unsave_post);
router.get('/:id/saved', user_controller.user_check_saved_post);

module.exports = router;
