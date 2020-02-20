var express = require('express');
var router = express.Router();

let optimize = require('../controllers/optimize.js');

router.get('/', optimize.get_optimize);
router.post('/', optimize.post_optimize);

module.exports = router;