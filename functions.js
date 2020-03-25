var spotify_handler = require('./spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('./classes.js');
const AUTH = require('./controllers/spotify_auth.js');

exports.calls_needed = function(limit_per_call, n) {
    return Math.ceil(n / limit_per_call);
}

exports.logged_in = function(session) {
    if (session.json) return true;
    else return false;
}

exports.log = function(msg) {
    console.log("\n" + msg + "\n");
}

exports.create_playlist = function(req, res, name, public) {
    if (name.length > 200) name = name.substring(0, 200);
    api_connection.createPlaylist(req.session.json['u_id'], name, {'public': public}).then(
        function(data) {
            new_playlist = new CLASSES.playlist_info(data.body['id'], name, data.body['images'], data.body['uri']);
            req.session.json['u_playlists'].unshift(new_playlist);
            songs_to_add = [];
            for (song in req.session.suggestions) {
                songs_to_add.push(req.session.suggestions[song]['uri']);
            }
            api_connection.addTracksToPlaylist(data.body['id'], songs_to_add).then(
                function(track_data) {
                    req.session.playlist_created = true;
                    var public_str = "private";
                    if (public) public_str = "public";
                    console.log("\n[PLAYLIST CREATION]: " + req.session.json['u_id'] + " created " + public_str + " playlist '" + name + "'\n");
                    res.redirect(200, '/home');
                },
                function(track_err) {
                    console.log(track_err);
                }
            );
        },
        function(err) {
            console.log(err);
        }
    );
}

exports.remove_tracks = function(playlist, tracks) {
    console.log("remove_tracks called, removing " + tracks.length + " tracks");

    for (track in tracks) {
        tracks[track] = {uri: "spotify:track:" + tracks[track]};
    }
    const NUM_REMOVE = tracks.length;
    const CALLS_NEEDED = this.calls_needed(100, NUM_REMOVE);

    for (var i = 0; i < CALLS_NEEDED; i = i + 1) {
        // Last batch of tracks
        // In large removal calls, the last batch likely contains between 1-100 tracks, not 100 exactly.
        if (i === (CALLS_NEEDED - 1)) {
            var list = tracks.slice(i * 100);
            api_connection.removeTracksFromPlaylist(playlist, list).then(
                function (data) {
                    console.log("Tracks successfully removed!");
                },
                function (err) {
                    console.log("Error in removing tracks, last call: ")
                    console.log(err);
                }
            )
        }
        // Either :
        // the first (and only) batch of tracks, containing 1-100 tracks
        // a subsequent (but not final) batch of tracks, containing exactly 100 tracks.
        else {
            var list = tracks.slice((i * 100), ((i * 100) + 100));
            api_connection.removeTracksFromPlaylist(playlist, list).then(
                function (data) {
                    console.log("Tracks successfully removed!");
                },
                function (err) {
                    console.log("Error in removing tracks, normal call: ")
                    console.log(err);
                }
            )
        }
    }
}

exports.add_tracks = function (playlist, tracks) {
    console.log("add_tracks called, adding " + tracks.length + " tracks");
    ////console.log(tracks);
    for (track in tracks) {
        tracks[track] = "spotify:track:" + tracks[track];
    }
    api_connection.addTracksToPlaylist(playlist, tracks).then(
        function (data) {
            console.log("Tracks successfully added!");
        },
        function (err) {
            console.log("Error in adding tracks: \n");
            console.log(err);
        }
    );
}

exports.artist_string = function(arr) {
    artists = "";
    num_added = 0;
    for (artist in arr) {
        // If there's more than 1 artist, handle placement of commas and "and's"
        if (Object.keys(arr).length > 1) {
            // "and" before last artist name
            if (num_added == Object.keys(arr).length - 1) {
                artists += " and " + arr[artist]['name'];
            }
            // Comma after all artists except the second to last one
            else if (!(num_added == Object.keys(arr).length - 2)) {
                artists += arr[artist]['name'] + ", ";
            }
            // Do nothing special for second to last artist.
            // the last artist will have an "and" placed before their name.
            else {
                artists += arr[artist]['name'];
            }
        }
        else {
            artists += arr[artist]['name'];
        }
        num_added += 1;
    }
    return artists;
}

exports.tracks_equal = function(t1, t2) {
    return (t1.id === t2.id);
}

exports.playlist_compare = function(suggested, selected) {
    // Should add
    suggested_not_selected = (suggested.filter(function (n) {
        for (var i = 0; i < selected.length; i++) {
            if (n.id == selected[i].id) {
                return false;
            }
        }
        return true;
    })).map(arr => arr.id);

    // Should remove
    selected_not_suggested = (selected.filter(function (n) {
        for (var i = 0; i < suggested.length; i++) {
            if (n.id == suggested[i].id) {
                return false;
            }
        }
        return true;
    })).map(arr => arr.id);
    
    // Should keep
    selected_suggested = (selected.filter(function (n) {
        for (var i = 0; i < suggested.length; i++) {
            if (n.id == suggested[i].id) {
                return true;
            }
        }
        return false;
    })).map(arr => arr.id);

    return {
        "add": suggested_not_selected, 
        "remove": selected_not_suggested, 
        "keep": selected_suggested
    };
}

exports.remove_duplicates = function(arr) {
    return arr.reduce((unique, o) => {
        if(!unique.some(obj => obj.id === o.id && obj.name === o.name && obj.artists === o.artists && obj.uri === o.uri && obj.artists === o.artists && obj.preview === o.preview && obj.image === o.image)) {
          unique.push(o);
        }
        return unique;
    },[])
}

exports.artist_alphabetize = function(a, b){
    var a_str = (a.artists).toLowerCase();
    var b_str = (b.artists).toLowerCase();
    if (a_str < b_str) { return -1; }
    if (a_str > b_str) { return 1; }
    return 0;
}

exports.get_image = function(res, arr, type) {
    if (type === "profile_picture") {
        if (arr.length != 0) {
            return arr['0']['url']
        }
        else return "./images/blank_profile.png"; 
    }
    else if (type === "album_art") {
        if (arr.length != 0) {
            return arr['0']['url']
        }
        else return "./images/mystery.png"; 
    }
    else {
        page_not_found(res);
    }
}

exports.minimum_playlists = function(playlist_arr) {
    const MIN_PLAYLISTS = 1;
    if (playlist_arr.length < MIN_PLAYLISTS) {
        return false;
    }
    else return true;
}

exports.logout = function(req, res) {
    console.log("[LOGOUT]: " + req.session.json['u_id'])
    req.session.destroy(function() {
        res.redirect('./');
    });
}

exports.page_not_found = function(res, type) {
    res.send("Error, please contact me at joe.muzina@gmail.com. " + type);
}

let set_json = function(req, data) {
    let set_promise = new Promise((resolve, reject) =>{
        req.session.json = JSON.parse(JSON.stringify(data));
        if (req.session.json) resolve(); else reject("error!");
    });

    set_promise.then(
        function(success){
            console.log(success);
        },
        function(failure) {
            console.log(failure);
            console.log("something went wrong!");
        }
    );
}

exports.post_handler = function(req, res, type) {
    if (type === "logout") {
        this.logout(req, res);
    }
    else if (type === "settings") {
        req.session.range = req.body.time_range;
        req.session.limit = req.body.limit;

        let set_suggestion_params = new Promise((resolve, reject) =>{
            req.session.range = req.body.time_range;
            req.session.limit = req.body.limit;
            if ((req.session.range != null) && (req.session.limit != null)) {
                resolve();
            }
            else reject("error setting suggestion parameters. Values: range = " + req.session.range + ", limit = " + req.session.limit);
        });

        set_suggestion_params.then(
            function(success) {
                req.session.save(function(err) {
                    res.redirect(200, '/suggestions');
                })
            },
            function(failure) {
                console.log(failure);
            }
        )
    }
    else if (type === "submit_new") {
        var public = false;
        if (req.body.public == 'true') public = true;

        this.create_playlist(req, res, req.body.playlist_name, public);
      }
    else if (type === "optimize_existing") {
        req.session.selected_playlist = req.body['selected_playlist'];
        res.redirect(200, '/optimize');
    }  
    else if (type === "save_changes") {
        if (req.body['remove_song']) {
          this.remove_tracks(req.session.selected_playlist, req.body['remove_song']);
        }
        if (req.body['add_song']) {
          this.add_tracks(req.session.selected_playlist, req.body['add_song']);
        }
        res.send("Save changes received");
    }
    else {
        this.page_not_found(res, type);
    }
}

exports.re_auth = function(req, res, next) {
    this.log("[RE-AUTHENTICATION] User " + req.session.json['u_id'] + " authentication failed, starting re-authentication process.")
    req.session.reauth = true;
    AUTH.get_login(req, res, next);
}

exports.update_playlists = function(req, res, next, user) {
    api_connection.getUserPlaylists(user.u_id, {limit: 50}).then(
        function(playlist_data) {
            if (playlist_data.body['items'].length === 0) {
                res.send("[Error] You must have at least one playlist on your account to use the playlist optimizer!");
                return;
            }
            playlists = [];
            num_pushed = 0;
            num_checked = 0;
            for (playlist in playlist_data.body['items']) {
                if ((playlist_data.body['items'][playlist]['owner']['id'] == user.u_id || playlist_data.body['items'][playlist]['collaborative']) && (num_pushed != Object.keys(playlist_data.body['items']).length - 1)) {
                    playlists.push(new CLASSES.playlist_info(playlist_data.body['items'][playlist]['id'], playlist_data.body['items'][playlist]['name'], playlist_data.body['items'][playlist]['images'], playlist_data.body['items'][playlist]['uri']));
                    num_pushed += 1;
                }
                else if ((num_checked == Object.keys(playlist_data.body['items']).length - 1) && (!req.session.json))  {
                    console.log("[LOGIN]: " + user.u_id);
                    let set_user_json = new Promise((resolve, reject) =>{
                        set_json(req, new CLASSES.user_info(user.u_id, user.p_name, user.profile_picture, playlists));
                        if (req.session.json) resolve(); else reject("error setting JSON");
                    })
                    set_user_json.then(
                        function(set_success) {
                            req.session.save(function(err){
                                if (req.session.reauth) {
                                    req.session.reauth = false;
                                    res.redirect(200, '/suggestions');
                                }
                                else res.redirect(200, '/home');
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
}