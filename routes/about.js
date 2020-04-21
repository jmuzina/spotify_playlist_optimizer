var express = require('express');
var router = express.Router();

let about = require('../controllers/about.js');

router.get('/', about.get_about);
router.post('/', about.post_about);

module.exports = router;