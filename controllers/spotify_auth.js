const CFG = require('../spotify_auth_cfg.js');

let whitelist = [];

exports.get_login = function(req, res, next) {
  let ip = req.connection.remoteAddress.substring(7);
  if (!whitelist.includes(ip)) {res.send("This site is under development! Check back soon!"); return; }
  console.log("get auth called");
  res.redirect('https://accounts.spotify.com/authorize' +
  '?response_type=code' +
  '&client_id=' + CFG.CLIENT_ID +
  (CFG.USER_SCOPES ? '&scope=' + encodeURIComponent(CFG.USER_SCOPES) : '') +
  '&redirect_uri=' + encodeURIComponent(CFG.REDIRECT_URI));
}
