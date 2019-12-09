var express = require('express');
var router = express.Router();

let welcome = require('../controllers/welcome.js');

router.get('/', welcome.get_welcome);
router.post('/', welcome.post_welcome);

module.exports = router;