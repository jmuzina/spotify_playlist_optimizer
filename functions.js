var spotify_handler = require('./spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('./classes.js');
const CRYPTO = require('./crypto.js');
let User = require('./models/user.js');
let STATS = require('./models/stats.js');
var underscore = require('underscore');

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
                        STATS.updateCreated(1, function() {
                            res.redirect(200, '/home');
                        })
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

function remove_with_delay(all_tracks, batch, selected_playlist, i, key) {
    const CALLS_NEEDED = exports.calls_needed(100, all_tracks.length)
    api_connection.setAccessToken(CRYPTO.decrypt(key));
    // Last batch of tracks
    // In large removal calls, the last batch likely contains between 1-100 tracks, not 100 exactly.
    if (i === (CALLS_NEEDED - 1) && (CALLS_NEEDED != 1)) {
        api_connection.removeTracksFromPlaylist(selected_playlist, batch).then(
            function (data) {
                STATS.updateRemoved(all_tracks.length, function() {
                    console.log("Tracks successfully removed!");
                })
            },
            function (err) {
                console.log("Error in removing tracks, last call: ")
                console.log(err);
                console.log("playlist: ");
                console.log(selected_playlist);
                console.log("tracks: ");
                console.log(batch);
                console.log("CALLS_NEEDED: ");
                console.log(CALLS_NEEDED);
            }
        )
    }
    // Either :
    // the first (and only) batch of tracks, containing 1-100 tracks
    // a nonfinal batch of tracks, containing exactly 100 tracks.
    else {
        let t = i;
        // Wait half a second between batches to avoid overwhelming Spotify's API
        // (They've gotten cranky with me in the past and thrown internal server errors)
        setTimeout(function() {
            if (t === 0 && CALLS_NEEDED != 1) batch = all_tracks.slice((t * 100), ((t * 100) + 100))
            else if (CALLS_NEEDED === 1) batch = all_tracks;
            find_batch(all_tracks, CALLS_NEEDED, t, function(batch) {
                api_connection.removeTracksFromPlaylist(selected_playlist, batch).then(
                    function (data) {
                        console.log("Tracks successfully removed!");
                        if (t + 1 === CALLS_NEEDED - 1){
                            remove_with_delay(all_tracks, all_tracks.slice((t + 1) * 100), selected_playlist, t + 1, key) 
                        } 
                        else if (CALLS_NEEDED === 1) {
                            return;
                        }
                        else {
                            remove_with_delay(all_tracks, all_tracks.slice(((t + 1) * 100), (((t + 1) * 100) + 100)), selected_playlist, t + 1, key)
                        }
                    },
                    function (err) {
                        console.log("Error in removing tracks, normal call: ")
                        console.log(err);
                        console.log("playlist: ");
                        console.log(selected_playlist);
                        console.log("tracks: ");
                        console.log(batch);
                        console.log("CALLS_NEEDED: ");
                        console.log(CALLS_NEEDED);
                    }
                )
            })
        }, 500);
    }
}

function find_batch(all_tracks, CALLS_NEEDED, t, done) {
    // First of many batches
    if (t === 0 && CALLS_NEEDED != 1) done(all_tracks.slice(0, 100));
    // Only batch
    else if (CALLS_NEEDED === 1) done(all_tracks);
    // Middle batches
    else done(all_tracks.slice(((t) * 100), (((t) * 100) + 100)));
}

exports.remove_tracks = function(req) {
    const tracks = req.body['remove_song'], 
    selected_playlist = req.user.selected_playlist;
   
    var LENGTH = 0, ARR = [];
    api_connection.setAccessToken(CRYPTO.decrypt(req.user.keys.access));
    // Handle removing only 1 track
    if (typeof(tracks) === "string") {
        LENGTH = 1;
        var track = [{uri: tracks}];
        api_connection.removeTracksFromPlaylist(selected_playlist, track).then(
            function (data) {
                STATS.updateRemoved(1, function() {
                    console.log("Track successfully removed!");
                })
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
        let offset = 0;
        for (track in tracks) {
            if (tracks[track] != "null") ARR[track - offset] = {uri: tracks[track]};
            else {
                offset = offset + 1
            }
        }
        LENGTH = ARR.length;
        var i = 0;
        remove_with_delay(ARR, ARR, selected_playlist, i, req.user.keys.access);
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
        ARR = [tracks];
    }
    else {
        LENGTH = tracks.length;
        for (track in tracks) {
            ARR[track] = tracks[track];
        }
    }
    console.log("add_tracks called, adding " + LENGTH + " tracks");
    
    api_connection.addTracksToPlaylist(selected_playlist, ARR).then(
        function (data) {
            STATS.updateAdded(LENGTH, function() {
                console.log("Tracks successfully added!");
            })
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

function intToCommaStr(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

exports.addCommas = function(obj, done) {
    done({
        tracksSuggested: intToCommaStr(obj.tracksSuggested),
        playlistsCreated: intToCommaStr(obj.playlistsCreated),
        playlistsOptimized: intToCommaStr(obj.playlistsOptimized),
        tracksRemoved: intToCommaStr(obj.tracksRemoved),
        tracksAdded: intToCommaStr(obj.tracksAdded)
    });
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

exports.playlist_compare = function(suggested, selected, done) {
    // Should add
    suggested_not_selected = (suggested.filter(function (n) {
        for (var i = 0; i < selected.length; i++) {
            if (n.uri == selected[i].uri) {
                return false;
            }
        }
        return true;
    }));

    // Should remove
    selected_not_suggested = (selected.filter(function (n) {
        for (var i = 0; i < suggested.length; i++) {
            if (n.uri == suggested[i].uri) {
                return false;
            }
        }
        return true;
    }));
    
    // Should keep
    selected_suggested = (selected.filter(function (n) {
        for (var i = 0; i < suggested.length; i++) {
            if (n.uri == suggested[i].uri) {
                return true;
            }
        }
        return false;
    }));

    done(JSON.parse(JSON.stringify({
        "add": this.remove_duplicates(suggested_not_selected).sort(this.artist_alphabetize), 
        "remove": this.remove_duplicates(selected_not_suggested).sort(this.artist_alphabetize), 
        "keep": this.remove_duplicates(selected_suggested).sort(this.artist_alphabetize)
    })));
}

// Replace URIs for out-of-market songs with appropriate URIs
function check_link(arr) {
    console.log("received: ");
    console.log(arr);
    for (track in arr) {
        if ('linked_from' in arr) arr[track]['uri'] = arr[track]['linked_from']['uri'];
    }
    return arr;
}

exports.remove_duplicates = function(arr) {
    return check_link(underscore.uniq(arr, function(d){ return d.uri }));
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
        User.updateOptimizationParams(req, function() {
            res.redirect(200, '/suggestions');
        })
    }
    else if (type === "submit_new") {
        var public = false;
        if (req.body.public == 'true') public = true;
        this.create_playlist(req, res, req.body.playlist_name, public);
      }
    else if (type === "optimize_existing") {
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
            STATS.updateOptimized(1, function() {
                res.redirect(200, '/home');
            })
        })
    }
    else {
        this.page_not_found(res, type);
    }
}

function has_access(user, playlist) {
    return ((playlist['owner']['id'] == user) || (playlist['collaborative']));
}

function playlist_batch(id, collected_playlists, limit, offset, done) {
    api_connection.getUserPlaylists(id, {limit: limit, offset: offset}).then(
        function(playlist_data) {
            if (playlist_data.body['items'].length === 0) {
                return res.redirect(200, '/home');
            }
            playlists = [];
            num_pushed = 0;
            num_checked = 0;
            for (playlist in playlist_data.body['items']) {
                if ((has_access(id, playlist_data.body['items'][playlist])) && (num_checked != Object.keys(playlist_data.body['items']).length - 1)) {
                    playlists.push(new CLASSES.playlist_info(playlist_data.body['items'][playlist]['id'], playlist_data.body['items'][playlist]['name'], playlist_data.body['items'][playlist]['images'], playlist_data.body['items'][playlist]['uri']));
                    num_pushed += 1;
                }
                else if ((num_checked == Object.keys(playlist_data.body['items']).length - 1))  {
                    // No more calls needed
                    if (num_checked != 49) {
                        if (offset != 0) done(collected_playlists);
                        else done(playlists);
                    }
                    // Further calls needed
                    else {
                        collected_playlists.push(...playlists);
                        playlist_batch(id, collected_playlists, 50, offset + 49, done);
                    }
                }
                num_checked += 1;
            }  
        },
        function(playlist_err) {
            console.log("[ERROR] [Update Playlists]:");
            console.log(playlist_err);
        }
    )
}

exports.update_playlists = function(req, res, next, callback) {
    playlist_batch(req.user.id, [], 50, 0, function(collected_playlists) {
        User.updatePlaylists(req, collected_playlists, callback);
    });
}