const OPTIMIZE = require("./optimize.js");
const SUGGESTIONS = require('./suggestions.js');
const FUNCTIONS = require('../functions.js');

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
  else if (req.body['type'] === "suggestion_action") {
    if (req.body['button_type'] === "create_new") {
      res.render('suggestions', { title: 'Our suggestions', user: req.session.json, suggestions: req.session.suggestions_json, making_new: true});
    }
    else if (req.body['button_type'] === "optimize_existing") {
      req.session.selected_playlist = req.body['selected_playlist'];
      OPTIMIZE.get_optimize(req, res, next);
    }
  }
  else if (req.body['type'] === "submit_new") {
    FUNCTIONS.create_playlist(req, req.body.playlist_name, req.body.private);
  }
  else {
    res.send("404 Error, please contact the webmaster.");
  }
}

exports.get_welcome = function(req, res, next) {
  res.render('welcome', { title: 'Spotify Playlist Optimizer' });
}

exports.post_welcome = function(req, res, next) {
  console.log("Welcome post received?");
}