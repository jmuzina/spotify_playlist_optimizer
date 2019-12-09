var express = require('express');
var router = express.Router();

let spotify_auth = require('../controllers/spotify_auth.js');

router.get('/', spotify_auth.get_login);

module.exports = router;