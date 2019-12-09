const session = require('express-session');
var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const WELCOME = require('./welcome.js');

class playlist_info {
    constructor(id, name, images) {
        this.p_id = id;
        this.p_name = name;    
        this.p_images = images;
    }
}

exports.get_home = function(req, res, next) {
    if (req.session.data_acquired === '1') {
        console.log("Attempting to render page");
        res.render('home', { title: 'Spotify Playlist Optimizer', name: req.session.profile_name, pfp: req.session.profile_picture, playlist_arr: req.session.playlists });
    }
    else {
        console.log("Getting user data");
        api_connection.getUser(req.session.user).then( 
            function(data) {
                req.session.data_acquired = false;
                api_connection.getUserPlaylists(req.session.user).then(
                    function(playlist_data) {
                        playlists = [];
                        num_pushed = 0;
                        num_checked = 0;
                        for (playlist in playlist_data.body['items']) {
                            if ((playlist_data.body['items'][playlist]['owner']['id'] == req.session.user || playlist_data.body['items'][playlist]['collaborative']) && (num_pushed != Object.keys(playlist_data.body['items']).length - 1)) {
                                playlists.push(new playlist_info(playlist_data.body['items'][playlist]['id'], playlist_data.body['items'][playlist]['name'], playlist_data.body['items'][playlist]['images']))
                                num_pushed += 1;
                            }
                            else if (num_checked == Object.keys(playlist_data.body['items']).length - 1) {
                                req.session.profile_name = data.body['display_name'];
                                req.session.profile_picture = data.body['images']['0']['url'];
                                req.session.playlists = playlists;
                                req.session.data_acquired = '1';
                                res.redirect('/home');
                            }
                            num_checked += 1;
                        }
                    },
                    function(err) {
                        console.log(err);
                    }
                )
            },
            function(err) {
                console.log(err);
            }
        );
    }
}

exports.post_home = function(req, res, next) {
    req.session.data_acquired = '';
    req.session.destroy()
    res.redirect('/');
}