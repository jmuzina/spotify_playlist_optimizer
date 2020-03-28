const FUNCTIONS = require('../functions.js');

exports.get_welcome = function(req, res, next) {
  console.log("[CONNECTION] " + req.connection.remoteAddress.substring(7));
  if (!FUNCTIONS.logged_in(req.session)) {
    res.render('welcome', { title: 'Spotify Playlist Optimizer' });
  }
  else {
    FUNCTIONS.default_session(req.session);
    res.render('welcome', { title: 'Spotify Playlist Optimizer', user: req.session.json});
  }
}

exports.post_welcome = function(req, res, next) {
  FUNCTIONS.logout(req, res);
}