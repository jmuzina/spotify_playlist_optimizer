var spotify_handler = require('./spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('./classes.js');
const CRYPTO = require('./crypto.js');
let User = require('./models/user.js');

exports.default_session = function(session) {
    if (session.range) delete session.range;
    if (session.limit) delete session.limit;
    if (session.suggestions) delete session.suggestions; // deprecate
    if (session.suggestions_json) delete session.suggestions_json;
    if (session.selected_playlist_id) delete session.selected_playlist_id;
    if (session.selected_playlist_json) delete session.selected_playlist_json;
}

exports.calls_needed = function(limit_per_call, n) {
    return Math.ceil(n / limit_per_call);
}

exports.logged_in = function(session) {
    console.log("checking for login on:");
    console.log(session);
    if (session.json) return true;
    else return false;
}

exports.log = function(msg) {
    console.log("\n" + msg + "\n");
}

exports.create_playlist = function(req, res, name, public) {
    if (name.length > 200) name = name.substring(0, 200);
    api_connection.setAccessToken(CRYPTO.decrypt(req.user.keys.access));
    api_connection.createPlaylist(req.user.id, name, {'public': public}).then(
        function(data) {
            songs_to_add = [];
            for (song in req.user.suggestions) {
                songs_to_add.push(req.user.suggestions[song]['uri']);
            }
            api_connection.addTracksToPlaylist(data.body['id'], songs_to_add).then(
                function(track_data) {
                    User.updateCreated(req, true, function() {
                        var public_str = "private";
                        if (public) public_str = "public";
                        console.log("\n[PLAYLIST CREATION]: " + req.user.id + " created " + public_str + " playlist '" + name + "'\n");
                        res.redirect(200, '/home');
                    })
                },
                function(track_err) {
                    console.log("[ERROR] [Create Playlist] [Add Tracks]:");
                    console.log(track_err);
                }
            );
        },
        function(err) {
            console.log("[ERROR] [Create Playlist]");
            console.log(err);
        }
    );
}

exports.remove_tracks = function(req) {
    const tracks = req.body['remove_song'], 
    selected_playlist = req.user.selected_playlist;
   
    var LENGTH = 0, ARR = [];
    api_connection.setAccessToken(CRYPTO.decrypt(req.user.keys.access));
    // Handle removing only 1 track
    if (typeof(tracks) === "string") {
        LENGTH = 1;
        var track = [{uri: "spotify:track:" + tracks}];
        api_connection.removeTracksFromPlaylist(selected_playlist, track).then(
            function (data) {
                console.log("Track successfully removed!");
            },
            function (err) {
                console.log("Error in removing tracks, single track: ")
                console.log(err);
                console.log("playlist: ");
                console.log(selected_playlist);
                console.log("track: ");
                console.log(track);
            }
        )
    }
    else {
        LENGTH = tracks.length;
        for (track in tracks) {
            ARR[track] = {uri: "spotify:track:" + tracks[track]};
        }
        const NUM_REMOVE = LENGTH;
        const CALLS_NEEDED = this.calls_needed(100, NUM_REMOVE);
        for (var i = 0; i < CALLS_NEEDED; i = i + 1) {
            // Last batch of tracks
            // In large removal calls, the last batch likely contains between 1-100 tracks, not 100 exactly.
            if (i === (CALLS_NEEDED - 1)) {
                api_connection.removeTracksFromPlaylist(selected_playlist, ARR.slice(i * 100)).then(
                    function (data) {
                        console.log("Tracks successfully removed!");
                    },
                    function (err) {
                        console.log("Error in removing tracks, last call: ")
                        console.log(err);
                        console.log("playlist: ");
                        console.log(selected_playlist);
                        console.log("tracks: ");
                        console.log(ARR.slice(i * 100));
                        console.log("CALLS_NEEDED: ");
                        console.log(CALLS_NEEDED);
                    }
                )
            }
            // Either :
            // the first (and only) batch of tracks, containing 1-100 tracks
            // a subsequent (but not final) batch of tracks, containing exactly 100 tracks.
            else {
                var list = ARR.slice((i * 100), ((i * 100) + 100));
                api_connection.removeTracksFromPlaylist(selected_playlist, list).then(
                    function (data) {
                        console.log("Tracks successfully removed!");
                    },
                    function (err) {
                        console.log("Error in removing tracks, normal call: ")
                        console.log(err);
                        console.log("playlist: ");
                        console.log(selected_playlist);
                        console.log("tracks: ");
                        console.log(ARR.slice((i * 100), ((i * 100) + 100)));
                        console.log("CALLS_NEEDED: ");
                        console.log(CALLS_NEEDED);
                    }
                )
            }
        } 
    }
    console.log("remove_tracks called, removing " + LENGTH + " tracks");
}

exports.add_tracks = function (req) {
    const selected_playlist = req.user.selected_playlist,
    tracks = req.body['add_song'];

    var LENGTH = 0, ARR = [];
    api_connection.setAccessToken(CRYPTO.decrypt(req.user.keys.access));
    // Handle adding only 1 track
    if (typeof(tracks) === "string") {
        LENGTH = 1;
        ARR = ["spotify:track:" + tracks];
    }
    else {
        LENGTH = tracks.length;
        for (track in tracks) {
            ARR[track] = "spotify:track:" + tracks[track];
        }
    }
    console.log("add_tracks called, adding " + LENGTH + " tracks");
    
    api_connection.addTracksToPlaylist(selected_playlist, ARR).then(
        function (data) {
            console.log("Tracks successfully added!");
        },
        function (err) {
            console.log("Error in adding tracks: \n");
            console.log(err);
            console.log("playlist: ");
            console.log(selected_playlist);
            console.log("tracks:" );
            console.log(ARR);
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

exports.get_image = function(arr, type) {
    if (type === "profile_picture") {
        if (arr.length != 0) {
            return arr['0']
        }
        else return "./images/blank_profile.png"; 
    }
    else if (type === "album_art") {
        if (arr.length != 0) {
            return arr['0']['url']
        }
        else return "./images/mystery.png"; 
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
    console.log("[LOGOUT]: " + req.user.id)
    User.deleteUser(req, function() {
        req.session.destroy(function() {
            res.redirect('./');
        });
    })
}

exports.page_not_found = function(res, type) {
    res.send("Error, please contact me at joe.muzina@gmail.com. " + type);
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
        req.session.selected_playlist_id = req.body['selected_playlist'];
        User.updateSelected(req, function() {
            res.redirect(200, '/optimize');
        });
    }  
    else if (type === "save_changes") {
        if (req.body['remove_song']) {
          this.remove_tracks(req);
        }
        if (req.body['add_song']) {
          this.add_tracks(req);
        }
        console.log("\n[PLAYLIST OPTIMIZATION]: " + req.user.id + " optimized playlist '" + req.user.selected_playlist + "'\n");
        User.updateOptimized(req, true, function() {
            res.redirect(200, '/home');
        })
    }
    else {
        this.page_not_found(res, type);
    }
}

exports.update_playlists = function(req, res, next, callback) {
    api_connection.getUserPlaylists(req.user.id, {limit: 50}).then(
        function(playlist_data) {
            if (playlist_data.body['items'].length === 0) {
                return res.redirect(200, '/home');
            }
            playlists = [];
            num_pushed = 0;
            num_checked = 0;
            for (playlist in playlist_data.body['items']) {
                if ((playlist_data.body['items'][playlist]['owner']['id'] == req.user.id || playlist_data.body['items'][playlist]['collaborative']) && (num_pushed != Object.keys(playlist_data.body['items']).length - 1)) {
                    playlists.push(new CLASSES.playlist_info(playlist_data.body['items'][playlist]['id'], playlist_data.body['items'][playlist]['name'], playlist_data.body['items'][playlist]['images'], playlist_data.body['items'][playlist]['uri']));
                    num_pushed += 1;
                }
                else if ((num_checked == Object.keys(playlist_data.body['items']).length - 1) && (!req.session.json))  {
                    User.updatePlaylists(req, playlists, callback);
                }
                num_checked += 1;
            }
        },
        function(playlist_err) {
            console.log("[ERROR] [Update Playlists]:");
            console.log(playlist_err);
        }
    );
}