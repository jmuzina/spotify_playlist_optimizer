var express = require('express');
var router = express.Router();

let options = require('../controllers/options.js');

router.get('/', options.get_options);

module.exports = router;