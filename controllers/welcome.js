const OPTIMIZE = require("./optimize.js");
const SUGGESTIONS = require('./suggestions.js');
const FUNCTIONS = require('../functions.js');

exports.get_redirect = function(req, res, next) {
  if (req.body['type'] === "logout") {
    FUNCTIONS.logout(req, res);
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
    FUNCTIONS.create_playlist(req, res, req.body.playlist_name, req.body.public);
  }
  else if (req.body['type'] === "save_changes") {
    if (req.body['remove_song']) {
      FUNCTIONS.remove_tracks(req.session.selected_playlist, req.body['remove_song']);
    }
    if (req.body['add_song']) {
      FUNCTIONS.add_tracks(req.session.selected_playlist, req.body['add_song']);
    }
    res.send("Save changes received");
  }
  else {
    FUNCTIONS.page_not_found(res);
  }
}

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