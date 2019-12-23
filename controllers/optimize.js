var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('../classes.js');
const FUNCTIONS = require('../functions.js');

exports.get_optimize = function(req, res, next) {
  api_connection.getPlaylist(req.session.selected_playlist).then(
    function(data) {
      var tracks = [];
      for (track in data.body['tracks']['items']) {
        data.body['tracks']['items'][track]['track']['name']
        tracks.push(new CLASSES.track_info(data.body['tracks']['items'][track]['track']['id'], data.body['tracks']['items'][track]['track']['name'], FUNCTIONS.artist_string(data.body['tracks']['items'][track]['track']['artists']), data.body['tracks']['items'][track]['track']['uri']));
      }
       res.render('optimize', {title: 'Optimize ' + data.body['name'], user: req.session.json, playlist_tracks: JSON.parse(JSON.stringify(tracks)), playlist_name: data.body['name'], playlist_images: data.body['images']});
     },
    function(err) {
      console.log("err: " + err);
    }
  ); 
}
