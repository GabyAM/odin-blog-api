const express = require('express');
const router = express.Router();

const post_controller = require('../controllers/post');
const comment_controller = require('../controllers/comment');

router.post('/', post_controller.post_create_post);
router.get('/:id', post_controller.post_detail);

router.get('/:id/comments', comment_controller.post_comments);
router.post('/:id/comments', comment_controller.post_comment_create_post);
router.get('/:id/comments/count', comment_controller.post_comment_count);

module.exports = router;
