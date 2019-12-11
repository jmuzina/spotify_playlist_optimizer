var express = require('express');
var router = express.Router();

let suggestions = require('../controllers/suggestions.js');

router.get('/', suggestions.get_suggestions);
router.post('/', suggestions.post_suggestions);

module.exports = router;