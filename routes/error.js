const express = require('express');
const router = express.Router();

const error_controller = require('../controllers/error');

router.post('/log', error_controller.log_error);

module.exports = router;
