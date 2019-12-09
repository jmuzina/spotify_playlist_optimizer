const SUGGESTIONS = require("./suggestions.js");

exports.get_redirect = function(req, res, next) {
  if (req.body['type'] === "logout") {
    req.session.destroy();
    res.redirect('/');
  } 
  else {
    req.session.selected_playlist = req.body['selected_playlist'];
    SUGGESTIONS.get_suggestions(req, res, next);
  }
}

exports.get_welcome = function(req, res, next) {
  res.render('welcome', { title: 'Spotify Playlist Optimizer' });
}

exports.post_welcome = function(req, res, next) {
  console.log("Welcome post received?");
}