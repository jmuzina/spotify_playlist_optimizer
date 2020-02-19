var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('../classes.js');
const FUNCTIONS = require('../functions.js')

exports.get_suggestions = function(req, res, next) {
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
      console.log("err: " + err);
    }
  );
}

exports.post_suggestions = function(req, res, next) {
  FUNCTIONS.post_handler(req, res, req.body['type']);
}