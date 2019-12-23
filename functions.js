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

exports.artist_string = function(arr) {
    artists = "";
    num_added = 0;
    for (artist in arr) {
        // If there's more than 1 artist, handle placement of commas and "and's"
        if (Object.keys(arr).length > 1) {
        // "and" before last artist name
        if (num_added == Object.keys(arr).length - 1) {
            artists += " and " + arr[artist]['name'];
        }
        // Comma after all artists except the second to last one
        else if (!(num_added == Object.keys(arr).length - 2)) {
            artists += arr[artist]['name'] + ", ";
        }
        // Do nothing special for second to last artist.
        // the last artist will have an "and" placed before their name.
        else {
            artists += arr[artist]['name'];
        }
        }
        else {
        artists += arr[artist]['name'];
        }
        num_added += 1;
    }
    return artists;
}