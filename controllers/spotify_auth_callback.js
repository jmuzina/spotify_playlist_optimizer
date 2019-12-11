var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const HOME = require('./home.js');

exports.get_auth_callback = function(req, res, next) {
  var code  = req.query.code;
  
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
          HOME.get_home(req, res, next);
        },
        function(err) {
          console.log(err);
        }
      )
    }, 
    function(err) {
      res.status(err.code);
      res.write(err.message);
      res.redirect('/');
      res.end();
    }
  )
}