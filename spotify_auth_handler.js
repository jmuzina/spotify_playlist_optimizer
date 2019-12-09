const CFG = require('./spotify_auth_cfg.js');
var spotify_api = require('spotify-web-api-node');

exports.spotify_connection = new spotify_api({
    clientId: CFG.CLIENT_ID,
    clientSecret: CFG.CLIENT_SECRET,
    redirectUri: CFG.REDIRECT_URI
  });