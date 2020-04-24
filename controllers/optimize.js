var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('../classes.js');
const FUNCTIONS = require('../functions.js');
const APP = require('../app.js');
const CRYPTO = require('../crypto.js');
let User = require('../models/user.js');

function track_data(arr, done) {
  let result = [], 
  num_local = 0;
  for (track in arr) {
    if (arr[track]['track']['is_local'] === false) {
      result.push(new CLASSES.track_info(
        arr[track]['track']['id'], 
        arr[track]['track']['name'], 
        FUNCTIONS.artist_string(arr[track]['track']['artists']), 
        ('linked_from' in arr[track]['track'] ? arr[track]['track']['linked_from']['uri'] : arr[track]['track']['uri']), 
        arr[track]['track']['preview_url'], 
        FUNCTIONS.get_image(arr[track]['track']['album']['images'], "album_art")
      ));
    }
    else num_local += 1;
    if (track == (arr.length - 1)) done(result, num_local);
  }
}

// Gets sets of playlist tracks 1 <= n <= 100 until end of playlist is reached
function offset_loop(user, tracks, offset, checked, CALLS_NEEDED, done) {
  api_connection.setAccessToken(CRYPTO.decrypt(user.keys.access));
  api_connection.getPlaylistTracks(user.selected_playlist, { offset: offset * 100 }).then(
    function(playlist_data) {
      track_data(playlist_data.body['items'], function(obj, num_local) {
        tracks.push(...obj);
        if ((checked + obj.length + num_local === (playlist_data.body['total'])) && (offset === CALLS_NEEDED - 1)) {
          done(tracks);
        }
        else {
          offset_loop(user, tracks, offset + 1, checked + obj.length + num_local, CALLS_NEEDED, done);
        }
      })
    }, 
    function(playlist_err) {
      console.log(playlist_err);
    }
  );
}

exports.get_optimize = function(req, res, next) {
  api_connection.setAccessToken(CRYPTO.decrypt(req.user.keys.access));
  api_connection.getPlaylist(req.user.selected_playlist).then(
    function(data) {
      const CALLS_NEEDED = FUNCTIONS.calls_needed(100, data.body['tracks']['total']);
      offset_loop(req.user, [], 0, 0, CALLS_NEEDED, function(tracks){
        FUNCTIONS.playlist_compare(req.user.suggestions, JSON.parse(JSON.stringify(tracks)), function(compared_result) {
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
  FUNCTIONS.post_handler(req, res, req.body['type']);
}
