var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('../classes.js');

exports.get_home = function(req, res, next) {
    api_connection.getUser(req.session.user).then( 
        function(user_data) {
            api_connection.getUserPlaylists(req.session.user, {limit: 50}).then(
                function(playlist_data) {
                    playlists = [];
                    num_pushed = 0;
                    num_checked = 0;
                    for (playlist in playlist_data.body['items']) {
                        if ((playlist_data.body['items'][playlist]['owner']['id'] == req.session.user || playlist_data.body['items'][playlist]['collaborative']) && (num_pushed != Object.keys(playlist_data.body['items']).length - 1)) {
                            playlists.push(new CLASSES.playlist_info(playlist_data.body['items'][playlist]['id'], playlist_data.body['items'][playlist]['name'], playlist_data.body['items'][playlist]['images'], playlist_data.body['items'][playlist]['uri']))
                            num_pushed += 1;
                        }
                        else if (num_checked == Object.keys(playlist_data.body['items']).length - 1) {
                            req.session.json = JSON.parse(JSON.stringify(new CLASSES.user_info(user_data.body['id'], user_data.body['display_name'], user_data.body['images']['0']['url'], playlists)));
                            res.render('home', { title: 'Spotify Playlist Optimizer', user: JSON.parse(JSON.stringify(new CLASSES.user_info(user_data.body['id'], user_data.body['display_name'], user_data.body['images']['0']['url'], playlists)))});
                        }
                        num_checked += 1;
                    }
                },
                function(playlist_err) {
                    console.log(playlist_err);
                }
            )
        },
        function(user_err) {
            console.log(user_err);
        }
    );
}

exports.post_home = function(req, res, next) {
    req.session.destroy()
    res.redirect('/');
}