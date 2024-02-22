const express = require('express');
const router = express.Router();

const post_controller = require('../controllers/post');
const comment_controller = require('../controllers/comment');

router.get('/:id', post_controller.post_detail);

router.get('/:id/comments', comment_controller.post_comments);
router.get('/:id/comments/count', comment_controller.post_comment_count);

module.exports = router;
