var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('../classes.js');

exports.get_suggestions = function(req, res, next) {
  res.render('suggestions', { title: 'Your Suggestions' });
}

exports.post_suggestions = function(req, res, next) {
  console.log("Suggestions post received?");
}

exports.top_tracks = function(req, res, next) {
  api_connection.getMyTopTracks({limit: req.body.limit, time_range: req.body.time_range}).then(
    function(data) {
      songs = [];
      for (song in data.body['items']) {
        artists = "";
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
        songs.push(new CLASSES.track_info(data.body['items'][song]['id'], data.body['items'][song]['name'], artists));   
      }
      res.render('suggestions', { title: 'Our suggestions', user: req.session.json, suggestions: JSON.parse(JSON.stringify(songs))});
    },
    function(err) {
      console.log("err: " + err);
    }
  );
}