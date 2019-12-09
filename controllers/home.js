var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;

class playlist_info {
    constructor(id, name, images) {
        this.p_id = id;
        this.p_name = name;    
        this.p_images = images;
    }
}

class user_info {
    constructor(id, name, profile_picture, playlists) {
        this.u_id = id;
        this.p_name = name;
        this.profile_picture = profile_picture;
        this.u_playlists = playlists;
    }
}

exports.get_home = function(req, res, next) {
    api_connection.getUser(req.session.user).then( 
        function(data) {
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
                            res.render('home', { title: 'Spotify Playlist Optimizer', user: (JSON.parse(JSON.stringify(new user_info(data.body['id'], data.body['display_name'], data.body['images']['0']['url'], playlists))))});
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

exports.post_home = function(req, res, next) {
    req.session.destroy()
    res.redirect('/');
}