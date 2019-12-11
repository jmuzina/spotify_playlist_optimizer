const OPTIONS = require("./options.js");
const SUGGESTIONS = require('./suggestions.js');

exports.get_redirect = function(req, res, next) {
  if (req.body['type'] === "logout") {
    req.session.destroy();
    res.redirect('/');
  } 
  else if (req.body['type'] === "settings") {
    req.session.range = req.body.time_range;
    req.session.limit = req.body.limit;
    SUGGESTIONS.top_tracks(req, res, next);
  }
  else {
    req.session.selected_playlist = req.body['selected_playlist'];
    OPTIONS.get_options(req, res, next);
  }
}

exports.get_welcome = function(req, res, next) {
  res.render('welcome', { title: 'Spotify Playlist Optimizer' });
}

exports.post_welcome = function(req, res, next) {
  console.log("Welcome post received?");
}