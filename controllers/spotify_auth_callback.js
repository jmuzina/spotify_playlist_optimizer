var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const HOME = require('./home.js');
const FUNCTIONS = require('../functions.js');
const CLASSES = require('../classes.js');

exports.get_auth_callback = function(req, res, next) {
  var code  = req.query.code;
  
  api_connection.authorizationCodeGrant(code).then(
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
          var profile_picture = FUNCTIONS.get_image(res, user_data.body['images'], "profile_picture");
          api_connection.getUserPlaylists(user_id, {limit: 50}).then(
            function(playlist_data) {
              if (!FUNCTIONS.minimum_playlists(playlist_data.body['items'])) {
                  res.send("[Error] You must have at least one playlist on your account to use the playlist optimizer!");
                  return;
              }
              playlists = [];
              num_pushed = 0;
              num_checked = 0;
              for (playlist in playlist_data.body['items']) {
                if ((playlist_data.body['items'][playlist]['owner']['id'] == user_id || playlist_data.body['items'][playlist]['collaborative']) && (num_pushed != Object.keys(playlist_data.body['items']).length - 1)) {
                  playlists.push(new CLASSES.playlist_info(playlist_data.body['items'][playlist]['id'], playlist_data.body['items'][playlist]['name'], playlist_data.body['items'][playlist]['images'], playlist_data.body['items'][playlist]['uri']));
                  num_pushed += 1;
                }
                else if (num_checked == Object.keys(playlist_data.body['items']).length - 1) {
                  console.log("[LOGIN]: " + user_id);

                  let set_json = new Promise((resolve, reject) =>{
                    FUNCTIONS.set_json(req, new CLASSES.user_info(user_id, display_name, profile_picture, playlists));
                    if (req.session.json) resolve(); else reject("error setting JSON");
                  })

                  set_json.then(
                    function(set_success) {
                      console.log("ID: " + req.sessionID);

                      //console.log("full session IN CALLBACK(): \n");
                      //console.log(req.session);
                      
                      //console.log("COOKIES IN CALLBACK: \n");
                      //console.log(req['cookies']);

                      console.log("callback req");
                      console.log((req['sessionID']));

                      req.session.save(function(){
                        res.redirect('/home');
                      });
                    },
                    function(set_error){
                      console.log(set_error);
                    }
                  );
                }
                num_checked += 1;
              }
            },
            function(playlist_err) {
              console.log(playlist_err);
            }
          );
        },
        function(user_err) {
          console.log(user_err);
        }
      );
    },
    function(auth_err) {
      FUNCTIONS.page_not_found(res);
    }
  )
}

exports.post_auth_callback = function(req, res, next) {
  res.send("POST AUTH CALLBACK ERROR.");
}