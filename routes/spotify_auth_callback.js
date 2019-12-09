var express = require('express');
var router = express.Router();

let spotify_auth_callback_controller = require('../controllers/spotify_auth_callback.js');
let welcome_controller = require('../controllers/welcome.js');

router.get('/', spotify_auth_callback_controller.get_auth_callback);
router.post('/', welcome_controller.get_redirect);

module.exports = router;