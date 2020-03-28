const FUNCTIONS = require('../functions.js');

exports.get_welcome = function(req, res, next) {
  if (!req.session.json) {
    res.render('welcome', { title: 'Spotify Playlist Optimizer' });
  }
  else {
    res.render('welcome', { title: 'Spotify Playlist Optimizer', user: req.session.json});
  }
}

exports.post_welcome = function(req, res, next) {
  FUNCTIONS.logout(req, res);
}