var spotify_handler = require('./spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;

exports.create_playlist = function(req, name, private) {
    api_connection.createPlaylist(req.session.user, name, {'public': !private}).then(
        function(data) {
            songs_to_add = [];
            for (song in req.session.suggestions) {
                songs_to_add.push(req.session.suggestions[song]['uri']);
            }
            api_connection.addTracksToPlaylist(data.body['id'], songs_to_add).then(
                function(track_data) {
                    console.log("Playlist created and songs inserted successfully!");
                },
                function(track_err) {
                    console.log(track_err);
                }
            );
        },
        function(err) {
            console.log(err);
        }
    );
}