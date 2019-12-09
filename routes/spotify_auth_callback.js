var express = require('express');
var router = express.Router();

let spotify_auth_callback_controller = require('../controllers/spotify_auth_callback.js');

router.get('/', spotify_auth_callback_controller.get_auth_callback);

module.exports = router;