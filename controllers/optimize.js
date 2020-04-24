var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const FUNCTIONS = require('../functions.js');
const APP = require('../app.js');
const CRYPTO = require('../crypto.js');

exports.get_optimize = function(req, res, next) {
  api_connection.setAccessToken(CRYPTO.decrypt(req.user.keys.access));
  api_connection.getPlaylist(req.user.selected_playlist).then(
    function(data) {
      const CALLS_NEEDED = FUNCTIONS.calls_needed(100, data.body['tracks']['total']);
      // Get set of all tracks in the selected playlist
      FUNCTIONS.offset_loop(req.user, [], 0, 0, CALLS_NEEDED, function(selected_tracks){
        // Compare selected playlist with suggested tracks
        FUNCTIONS.playlist_compare(req.user.suggestions, JSON.parse(JSON.stringify(selected_tracks)), function(compared_result) {
          res.render('optimize', { title: 'Optimize ' + data.body['name'], user: req.user, playlist_name: data.body['name'], playlist_images: data.body['images'], playlist_uri: data.body['uri'].substring(17), comparison: compared_result, version: APP.VERSION});
        })
      });
    },
    function(err) {
      console.log(err);
    }
  ); 
}

exports.post_optimize = function(req, res, next) {
  FUNCTIONS.post_handler(req, res);
}
