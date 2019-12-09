const request = require('request'); // uninstall this later
var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;

class spotify_top_tracks_options {
  constructor(term, max_tracks) {
    this.time_range = term;
    this.limit = max_tracks;
  }
}

exports.get_auth_callback = function(req, res, next) {
  var code  = req.query.code;
  var state = req.query.state;
  
  api_connection.authorizationCodeGrant(code).then(
    function(data) {
      var access = data.body['access_token'];
      var refresh = data.body['refresh_token']

      api_connection.setAccessToken(access);
      api_connection.setRefreshToken(refresh);

      api_connection.getMe().then(
        function(data) {
          req.session.key = access;
          req.session.refresh = refresh;
          req.session.user = data.body['id'];
          res.redirect('./home');
        },
        function(err) {
          console.log(err);
        }
      )

      connection_options = new spotify_top_tracks_options("short_term", 50);
      
      api_connection.getMyTopTracks(connection_options).then(
        function(data) {
          for (song in data.body['items']) {
            song_title = data.body['items'][song]['name'];
            artists = "";
            song_id = data.body['items'][song]['id'];

            num_added = 0;
            for (artist in data.body['items'][song]['artists']) {
              // If there's more than 1 artist, handle placement of commas and "and's"
              if (Object.keys(data.body['items'][song]['artists']).length > 1) {
                // "and" before last artist name
                if (num_added == Object.keys(data.body['items'][song]['artists']).length - 1) {
                  artists += " and " + data.body['items'][song]['artists'][artist]['name'];
                }
                // Comma after all artists except the second to last one
                else if (!(num_added == Object.keys(data.body['items'][song]['artists']).length - 2)) {
                  artists += data.body['items'][song]['artists'][artist]['name'] + ", ";
                }
                // Do nothing special for second to last artist.
                // the last artist will have an "and" placed before their name.
                else {
                  artists += data.body['items'][song]['artists'][artist]['name'];
                }
              }
              else {
                artists += data.body['items'][song]['artists'][artist]['name'];
              }
              num_added += 1;
            }
            //console.log(song_title + " | " + artists + " | " + song_id);
          }
        },
        function(err) {
          console.log("err: " + err);
        }
      );
      //res.send(new spotify_user_keys(access, refresh));
    }, 
    function(err) {
      res.status(err.code);
      res.write(err.message);
      res.redirect('/');
      res.end();
    }
  )
}