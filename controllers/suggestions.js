var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('../classes.js');
const FUNCTIONS = require('../functions.js')
const CFG = require('../spotify_auth_cfg.js');
const AUTH = require('./spotify_auth.js');

exports.get_suggestions = function(req, res, next) {
  api_connection.getMyTopTracks({limit: req.session.limit, time_range: req.session.range}).then(
    function(data) {
      tracks = [];
      for (song in data.body['items']) {
        artists = FUNCTIONS.artist_string(data.body['items'][song]['artists']);
        tracks.push(new CLASSES.track_info(data.body['items'][song]['id'], data.body['items'][song]['name'], artists, data.body['items'][song]['uri'], data.body['items'][song]['preview_url'], data.body['items'][song]['album']['images'][0]['url']));   
      }
      req.session.suggestions_json = JSON.parse(JSON.stringify(tracks.sort(FUNCTIONS.artist_alphabetize)));
      res.render('suggestions', { title: 'Our suggestions', user: req.session.profile, suggestions: req.session.suggestions_json, playlists: req.session.playlists, pfp: req.session.pfp});
    },
    function(err) {
      console.log(err);
    }
  );
}

exports.post_suggestions = function(req, res, next) {
  FUNCTIONS.post_handler(req, res, req.body['type']);
}