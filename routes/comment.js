const express = require('express');
const router = express.Router();

const comment_controller = require('../controllers/comment');

router.get('/:id', comment_controller.comment_detail);

router.post('/:id/update', comment_controller.comment_update_post);

router.post('/:id/delete', comment_controller.comment_delete_post);

router.get('/:id/comments', comment_controller.comment_replies);
router.post('/:id/comments', comment_controller.comment_reply_create_post);

module.exports = router;
