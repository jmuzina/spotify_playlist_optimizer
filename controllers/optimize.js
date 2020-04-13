var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('../classes.js');
const FUNCTIONS = require('../functions.js');
let User = require('../models/user.js');

// Gets sets of playlist tracks 1 <= n <= 100 until end of playlist is reached
function offset_loop(req, res, data, CALLS_NEEDED, tracks) {
  var songNum = 100;
  for (var api_offset = 1; api_offset < CALLS_NEEDED; api_offset = api_offset + 1) {
    api_connection.getPlaylistTracks(req.user.selected_playlist, { offset: api_offset * 100 }).then(
      function (offset_data) {
        for (track in offset_data.body['items']) {
          if (offset_data.body['items'][track]['track']['id']) {
            songNum = songNum + 1;
            tracks.push(new CLASSES.track_info(offset_data.body['items'][track]['track']['id'], offset_data.body['items'][track]['track']['name'], FUNCTIONS.artist_string(offset_data.body['items'][track]['track']['artists']), offset_data.body['items'][track]['track']['uri'], offset_data.body['items'][track]['track']['preview_url'], FUNCTIONS.get_image(offset_data.body['items'][track]['track']['album']['images'], "album_art")));
          }
          if (songNum === (data.body['tracks']['total'] - 1)) {
            ///////
            compared = JSON.parse(JSON.stringify(FUNCTIONS.playlist_compare(req.user.suggestions, selected_playlist)));

            combined = selected_playlist; // copy selected_playlist data to combined playlist to start
            for (track in req.user.suggestions) { combined.push(req.session.suggestions_json[track]) }; // add all user suggestions to the combined playlist
            combined = JSON.parse(JSON.stringify((FUNCTIONS.remove_duplicates(combined)).sort(FUNCTIONS.artist_alphabetize))); // alphabetize, remove duplicates, and parse the combined playlist

            res.render('optimize', { title: 'Optimize ' + data.body['name'], user: req.user, playlist_name: data.body['name'], playlist_images: data.body['images'], playlist_uri: data.body['uri'].substring(17), combined_songs: combined, comparison: compared });
          }
        }
      },
      function (offset_err) {
        console.log(offset_err);
      }
    )
  }
}

exports.get_optimize = function(req, res, next) {
  api_connection.getPlaylist(req.user.selected_playlist).then(
    function(data) {
      var tracks = [];
      const CALLS_NEEDED = FUNCTIONS.calls_needed(100, data.body['tracks']['total']);
      for (track in data.body['tracks']['items']) {
        if (data.body['tracks']['items'][track]['track']['id']) {
          tracks.push(new CLASSES.track_info(data.body['tracks']['items'][track]['track']['id'], data.body['tracks']['items'][track]['track']['name'], FUNCTIONS.artist_string(data.body['tracks']['items'][track]['track']['artists']), data.body['tracks']['items'][track]['track']['uri'], data.body['tracks']['items'][track]['track']['preview_url'], FUNCTIONS.get_image(data.body['tracks']['items'][track]['track']['album']['images'], "album_art")));
        }
      }
      // Handle playlists larger than 100 tracks
      if (CALLS_NEEDED != 1) {
        offset_loop(req, res, data, CALLS_NEEDED, tracks);
      }
      else {
        let selected_playlist_json = JSON.parse(JSON.stringify(tracks));
        compared = JSON.parse(JSON.stringify(FUNCTIONS.playlist_compare(req.user.suggestions, selected_playlist_json)));

        combined = selected_playlist_json;
        for (track in req.user.suggestions) {combined.push(req.user.suggestions[track])}; // copy all songs in suggestions into the combined list
        
        combined = JSON.parse(JSON.stringify((FUNCTIONS.remove_duplicates(combined)).sort(FUNCTIONS.artist_alphabetize)));
        
        res.render('optimize', { title: 'Optimize ' + data.body['name'], user: req.user, playlist_name: data.body['name'], playlist_images: data.body['images'], playlist_uri: data.body['uri'].substring(17), combined_songs: combined, comparison: compared});
      }
    },
    function(err) {
      console.log(err);
    }
  ); 
}

exports.post_optimize = function(req, res, next) {
  FUNCTIONS.post_handler(req, res, req.body['type']);
}
