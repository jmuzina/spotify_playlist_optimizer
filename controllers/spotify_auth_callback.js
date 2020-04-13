var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const HOME = require('./home.js');
const FUNCTIONS = require('../functions.js');
const CLASSES = require('../classes.js');

exports.get_auth_callback = function(req, res, next) {
  console.log(req.query);
  api_connection.authorizationCodeGrant(req.query.code).then(
    function(auth_data) {
      var access = auth_data.body['access_token'];
      var refresh = auth_data.body['refresh_token']

      api_connection.setAccessToken(access);
      api_connection.setRefreshToken(refresh);

      api_connection.getMe().then(
        function(user_data) {
          req.session.key = access;
          req.session.refresh = refresh;
          var user_id = user_data.body['id'];
          var display_name = user_data.body['display_name'];
          var profile_picture = FUNCTIONS.get_image(user_data.body['images'], "profile_picture");
          FUNCTIONS.update_playlists(req, res, next);
        },
        function(user_err) {
          console.log("[ERROR] [Get Me]:");
          console.log(user_err);
        }
      );
    },
    function(auth_err) {
      console.log("[ERROR] [Authorization Code Grant]:");
      console.log(auth_err);
      FUNCTIONS.page_not_found(res);
    }
  )
}

exports.post_auth_callback = function(req, res, next) {
  res.send("POST AUTH CALLBACK ERROR.");
}