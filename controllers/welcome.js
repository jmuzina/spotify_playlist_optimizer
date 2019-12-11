const OPTIONS = require("./options.js");
var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;

exports.get_redirect = function(req, res, next) {
  if (req.body['type'] === "logout") {
    req.session.destroy();
    res.redirect('/');
  } 
  else if (req.body['type'] === "settings") {
    req.session.range = req.body.time_range;
    req.session.limit = req.body.limit;
      
      api_connection.getMyTopTracks({limit: req.body.limit, time_range: req.body.time_range}).then(
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
            console.log(song_title + " | " + artists + " | " + song_id);
          }
        },
        function(err) {
          console.log("err: " + err);
        }
      );
    res.render('suggestions', { title: 'Our suggestions', user: req.session.json });
  }
  else {
    req.session.selected_playlist = req.body['selected_playlist'];
    OPTIONS.get_options(req, res, next);
  }
}

exports.get_welcome = function(req, res, next) {
  res.render('welcome', { title: 'Spotify Playlist Optimizer' });
}

exports.post_welcome = function(req, res, next) {
  console.log("Welcome post received?");
}