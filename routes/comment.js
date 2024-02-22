const express = require('express');
const router = express.Router();

const comment_controller = require('../controllers/comment');

router.get('/:id', comment_controller.comment_detail);

module.exports = router;
