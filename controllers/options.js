var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;

exports.get_options = function(req, res, next) {
  api_connection.getPlaylist(req.session.selected_playlist).then(
    function(data) {
      res.render('options', {title: 'Options', user: req.session.json, selected_playlist: req.session.selected_playlist, playlist_name: data.body['name'], playlist_images: data.body['images']});
    },
    function(err) {
      console.log(err);
    }
  ); 
}