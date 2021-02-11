var express = require('express');
var router = express.Router();

let error = require('../controllers/error.js');

router.get('/', error.get_error);
router.post('/', error.post_error);

module.exports = router;