const session = require('express-session');

exports.get_redirect = function(req, res, next) {
  res.redirect('/');
}

exports.get_welcome = function(req, res, next) {
  res.render('welcome', { title: 'Spotify Playlist Optimizer' });
}

exports.post_welcome = function(req, res, next) {
  console.log("Welcome post received?");
}