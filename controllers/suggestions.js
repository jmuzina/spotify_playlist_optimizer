var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('../classes.js');
const FUNCTIONS = require('../functions.js')
const CRYPTO = require('../crypto.js');
const USERS = require('../models/user.js');
const APP = require('../app.js');

exports.get_suggestions = function(req, res, next) {
  api_connection.setAccessToken(CRYPTO.decrypt(req.user.keys.access));
  api_connection.getMyTopTracks({limit: req.user.limit, time_range: req.user.range}).then(
    function(data) {
      tracks = [];
      for (song in data.body['items']) {
        artists = FUNCTIONS.artist_string(data.body['items'][song]['artists']);
        tracks.push(new CLASSES.track_info(data.body['items'][song]['id'], data.body['items'][song]['name'], artists, data.body['items'][song]['uri'], data.body['items'][song]['preview_url'], data.body['items'][song]['album']['images'][0]['url']));   
      }
      var suggestions = JSON.parse(JSON.stringify(tracks.sort(FUNCTIONS.artist_alphabetize)));
      USERS.updateSuggestions(req, suggestions, function(error, result) {
        if (error) res.redirect('./');
        else {
          FUNCTIONS.update_playlists(req, res, next, function(err, obj) {
            res.render('suggestions', { title: 'Our suggestions', user: req.user, version: APP.VERSION});
          });
        }
      })
    },
    function(err) {
      console.log(err);
    }
  );
}

exports.post_suggestions = function(req, res, next) {
  FUNCTIONS.post_handler(req, res, req.body['type']);
}