var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('../classes.js');
const FUNCTIONS = require('../functions.js');

exports.get_optimize = function(req, res, next) {
  api_connection.getPlaylist(req.session.selected_playlist).then(
    function(data) {
      var tracks = [];
      for (track in data.body['tracks']['items']) {
        tracks.push(new CLASSES.track_info(data.body['tracks']['items'][track]['track']['id'], data.body['tracks']['items'][track]['track']['name'], FUNCTIONS.artist_string(data.body['tracks']['items'][track]['track']['artists']), data.body['tracks']['items'][track]['track']['uri'], data.body['tracks']['items'][track]['track']['preview_url'], data.body['tracks']['items'][track]['track']['album']['images'][0]['url']));
      }
      req.session.selected_json = JSON.parse(JSON.stringify(tracks));
      compared = JSON.parse(JSON.stringify(FUNCTIONS.playlist_compare(req.session.suggestions_json, req.session.selected_json)));

      combined = req.session.selected_json;
      for (track in req.session.suggestions_json) {combined.push(req.session.suggestions_json[track])};
      combined = JSON.parse(JSON.stringify(FUNCTIONS.remove_duplicates(combined)));
      
      res.render('optimize', { title: 'Optimize ' + data.body['name'], user: req.session.json, playlist_name: data.body['name'], playlist_images: data.body['images'], playlist_uri: data.body['uri'].substring(17), combined_songs: combined, comparison: compared});
     },
    function(err) {
      console.log("err: " + err);
    }
  ); 
}
