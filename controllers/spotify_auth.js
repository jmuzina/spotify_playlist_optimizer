const CFG = require('../spotify_auth_cfg.js');

exports.get_login = function(req, res, next) {
  console.log("get auth called");
  res.redirect('https://accounts.spotify.com/authorize' +
  '?response_type=code' +
  '&client_id=' + CFG.CLIENT_ID +
  (CFG.USER_SCOPES ? '&scope=' + encodeURIComponent(CFG.USER_SCOPES) : '') +
  '&redirect_uri=' + encodeURIComponent(CFG.REDIRECT_URI));
}
