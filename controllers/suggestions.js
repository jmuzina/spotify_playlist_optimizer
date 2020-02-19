var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('../classes.js');
const FUNCTIONS = require('../functions.js')
const CFG = require('../spotify_auth_cfg.js');
const AUTH = require('./spotify_auth.js');

exports.get_suggestions = function(req, res, next) {
  if (FUNCTIONS.logged_in(req.session)) {
    api_connection.getMyTopTracks({limit: req.session.limit, time_range: req.session.range}).then(
      function(data) {
        tracks = [];
        for (song in data.body['items']) {
          artists = FUNCTIONS.artist_string(data.body['items'][song]['artists']);
          tracks.push(new CLASSES.track_info(data.body['items'][song]['id'], data.body['items'][song]['name'], artists, data.body['items'][song]['uri'], data.body['items'][song]['preview_url'], data.body['items'][song]['album']['images'][0]['url']));   
        }
        req.session.suggestions = tracks.sort(FUNCTIONS.artist_alphabetize);
        req.session.suggestions_json = JSON.parse(JSON.stringify(tracks));
        res.render('suggestions', { title: 'Our suggestions', user: req.session.json, suggestions: req.session.suggestions_json});
      },
      function(err) {
        console.log(err);
        // If Authentication has failed, re-authenticate
        if (err.statusCode == 401) {
          FUNCTIONS.log("[RE-AUTHENTICATION] User " + req.session.json['u_id'] + " authentication failed in suggestions, starting re-authentication process.")
          req.session.reauth = true;
          AUTH.get_login(req, res, next);
        }
        else res.redirect('./');
      }
    );
  }
  else { // user not logged in, send to login page
    console.log("suggestions user not logged in");
    res.redirect('./');
  }
}

exports.post_suggestions = function(req, res, next) {
  FUNCTIONS.post_handler(req, res, req.body['type']);
}