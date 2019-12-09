var express = require('express');
var router = express.Router();

let home_controller = require('../controllers/home.js');

router.get('/', home_controller.get_home);
router.post('/', home_controller.post_home);

module.exports = router;