const OPTIONS = require("./options.js");
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
    res.render('suggestions', { title: 'Our suggestions', user: req.session.json, suggestions: req.session.suggestions_json, making_new: true});
    //FUNCTIONS.create_playlist(req);
  }
  else if (req.body['type'] === "submit_new") {
    FUNCTIONS.create_playlist(req, req.body.playlist_name, req.body.private);
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