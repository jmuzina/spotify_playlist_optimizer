var spotify_handler = require('./spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('./classes.js');
const CRYPTO = require('./crypto.js');
let User = require('./models/user.js');
let STATS = require('./models/stats.js');
var underscore = require('underscore');

// Returns number of API calls needed to sort through n items, given limit l.
exports.calls_needed = function(l, n) {
    return Math.ceil(n / l);
}

// Creates a playlist on a user's account
exports.create_playlist = function(req, res, name, public) {
    if (name.length > 200) name = name.substring(0, 200); // Keep playlist names less than 200 characters
    api_connection.setAccessToken(CRYPTO.decrypt(req.user.keys.access)); // Make sure we're using the right access key
    api_connection.createPlaylist(req.user.id, name, {'public': public}).then(
        function(data) {
            songs_to_add = [];
            for (song in req.user.suggestions) {
                songs_to_add.push(req.user.suggestions[song]['uri']);
            }
            api_connection.addTracksToPlaylist(data.body['id'], songs_to_add).then(
                function(track_data) {
                    // Update statistics and redirect home
                    User.updateCreated(req, true, function() {
                        var public_str = "private";
                        if (public) public_str = "public";
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

// Recursively remove tracks from a user's playlist in delayed batches
function remove_with_delay(all_tracks, batch, selected_playlist, i, key) {
    const CALLS_NEEDED = exports.calls_needed(100, all_tracks.length)
    api_connection.setAccessToken(CRYPTO.decrypt(key)); // Use the correct key
    // Last batch of tracks
    // In large removal calls, the last batch likely contains between 1-100 tracks, not 100 exactly.
    if (i === (CALLS_NEEDED - 1) && (CALLS_NEEDED != 1)) {
        api_connection.removeTracksFromPlaylist(selected_playlist, batch).then(
            function (data) {
                // Update statistics
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
        // Failing to send these delete requests in delayed batches tends to overload 
        // Spotify's API, throwing code 500 internal server errors.
        setTimeout(function() {
            find_batch(all_tracks, CALLS_NEEDED, t, function(batch) {
                api_connection.removeTracksFromPlaylist(selected_playlist, batch).then(
                    function (data) {
                        // Penultimate batch
                        if (t + 1 === CALLS_NEEDED - 1){
                            remove_with_delay(all_tracks, all_tracks.slice((t + 1) * 100), selected_playlist, t + 1, key) 
                        } 
                        // First and only batch - tracks have already been removed so no need for further calls
                        else if (CALLS_NEEDED === 1) {
                            return;
                        }
                        // Somewhere in the middle batch
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

// Returns a batch of tracks
function find_batch(all_tracks, CALLS_NEEDED, t, done) {
    // First of many batches
    if (t === 0 && CALLS_NEEDED != 1) done(all_tracks.slice(0, 100));
    // Only batch
    else if (CALLS_NEEDED === 1) done(all_tracks);
    // Middle batches
    else done(all_tracks.slice(((t) * 100), (((t) * 100) + 100)));
}

// Remove tracks from a user's playlist
exports.remove_tracks = function(req) {
    // The songs marked to be removed in the optimization form
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
    // Removing more than 1 track
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
        remove_with_delay(ARR, ARR, selected_playlist, i, req.user.keys.access); // start recursive remove call
    }
}

// Add tracks to a user's playlist
exports.add_tracks = function (req) {
    const selected_playlist = req.user.selected_playlist,
    tracks = req.body['add_song']; // Tracks user marked to add in optimization page

    var LENGTH = 0, ARR = [];
    api_connection.setAccessToken(CRYPTO.decrypt(req.user.keys.access)); // Use the right access key
    // Handle adding only 1 track
    if (typeof(tracks) === "string") {
        LENGTH = 1;
        ARR = [tracks];
    }
    // Adding more than 1 track
    else {
        LENGTH = tracks.length;
        for (track in tracks) {
            ARR[track] = tracks[track];
        }
    }
    
    api_connection.addTracksToPlaylist(selected_playlist, ARR).then(
        function (data) {
            // Update stats
            STATS.updateAdded(LENGTH, function() {
                // Tracks have been successfully added
            })
        },
        function (err) {
            this.page_not_found(req, err);
        }
    );
}

// Return an array of track objects (1-100 tracks at a time)
exports.track_data = function(arr, done) {
    let result = [], 
    num_local = 0;
    for (track in arr) {
        // Push track objects into an array, ignoring local-only tracks
        if (arr[track]['track']['is_local'] === false) {
            result.push(new CLASSES.track_info(
            arr[track]['track']['id'], 
            arr[track]['track']['name'], 
            this.artist_string(arr[track]['track']['artists']), 
            ('linked_from' in arr[track]['track'] ? arr[track]['track']['linked_from']['uri'] : arr[track]['track']['uri']), 
            arr[track]['track']['preview_url'], 
            this.get_image(arr[track]['track']['album']['images'], "album_art")
            ));
        }
        else num_local += 1;
        if (track == (arr.length - 1)) done(result, num_local);
    }
}

// Recursively returns array of track objects given a playlist ID
exports.offset_loop = function(user, tracks, offset, checked, CALLS_NEEDED, done) {
    api_connection.setAccessToken(CRYPTO.decrypt(user.keys.access)); // Use the right access key
    api_connection.getPlaylistTracks(user.selected_playlist, { offset: offset * 100 }).then(
      function(playlist_data) {
        require('./functions.js').track_data(playlist_data.body['items'], function(track_batch, num_local) {
          tracks.push(...track_batch); // Push new batch onto the result array
          // All tracks have been pushed onto the array
          if ((checked + track_batch.length + num_local === (playlist_data.body['total'])) && (offset === CALLS_NEEDED - 1)) {
            done(tracks);
          }
          else {
            require('./functions.js').offset_loop(user, tracks, offset + 1, checked + track_batch.length + num_local, CALLS_NEEDED, done); // recursive call
          }
        })
      }, 
      function(playlist_err) {
        console.log(playlist_err);
      }
    );
  }

// Format an int into a string with commas appropriately placed
// I.E. intToCommaStr(1000000000) === "1,000,000,000"
function intToCommaStr(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Add commas to all stat numbers in case they're > 1,000
exports.addCommas = function(obj, done) {
    done({
        tracksSuggested: intToCommaStr(obj.tracksSuggested),
        playlistsCreated: intToCommaStr(obj.playlistsCreated),
        playlistsOptimized: intToCommaStr(obj.playlistsOptimized),
        tracksRemoved: intToCommaStr(obj.tracksRemoved),
        tracksAdded: intToCommaStr(obj.tracksAdded)
    });
}

// Format text representation of artists
// I.E. ["Metallica", "Bon Jovi", "Soundgarden"] -> "Metallica, Bon Jovi and Soundgarden"
// ["Metallica"] -> "Metallica"
// ["Metallica", "Soundgarden"] -> "Metallica and Soundgarden"
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
        // Only one artist, just use their name
        else {
            artists += arr[artist]['name'];
        }
        num_added += 1;
    }
    return artists;
}

// Returns an object containing songs to add, remove, and keep
exports.playlist_compare = function(suggested, selected, done) {
    // Song is suggested but not in the existing playlist
    // Recommendation: Add
    suggested_not_selected = (suggested.filter(function (n) {
        for (var i = 0; i < selected.length; i++) {
            if (n.uri == selected[i].uri) {
                return false;
            }
        }
        return true;
    }));

    // Song is in the existing playlist but is not suggested
    // Recommendation: Remove
    selected_not_suggested = (selected.filter(function (n) {
        for (var i = 0; i < suggested.length; i++) {
            if (n.uri == suggested[i].uri) {
                return false;
            }
        }
        return true;
    }));
    
    // Song is suggested and already in the existing playlist
    // Recommendation: keep
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

// Removes tracks with matching URIs
exports.remove_duplicates = function(arr) {
    return underscore.uniq(arr, function(d){ return d.uri });
}

// Alphabetize artist names
exports.artist_alphabetize = function(a, b){
    var a_str = (a.artists).toLowerCase();
    var b_str = (b.artists).toLowerCase();
    if (a_str < b_str) { return -1; }
    if (a_str > b_str) { return 1; }
    return 0;
}

// Picture handling
exports.get_image = function(arr, type) {
    if (type === "profile_picture") {
        // User has a profile picture
        if (arr.length != 0) {
            return arr['0']
        }
        else return "./images/blank_profile.png";  // User has no profile picture - use a blank
    }
    else if (type === "album_art") {
        // Track has album art
        if (arr.length != 0) {
            return arr['0']['url']
        }
        else return "./images/mystery.png";  // Track has no album art - replace with a question mark
    }
}

// Logout handling
exports.logout = function(req, res) {
    // Delete user session data from database
    User.deleteUser(req, function() {
        // Delete cookie
        req.session.destroy(function() {
            // Send to homepage
            res.redirect('./');
        });
    })
}

// Routing errors, etc.
exports.page_not_found = function(res, type) {
    console.log(type);
    res.redirect(200, '/error');
}

// Handle form submissions
exports.post_handler = function(req, res) {
    let type = req.body['type'];
    if (type === "logout") {
        this.logout(req, res);
    }
    // Suggestion settings on homepage
    else if (type === "settings") {
        User.updateOptimizationParams(req, function() {
            res.redirect(200, '/suggestions');
        })
    }
    // Creating a new playlist
    else if (type === "submit_new") {
        var public = false;
        if (req.body.public == 'true') public = true;
        this.create_playlist(req, res, req.body.playlist_name, public);
    }
    // Optimizing an existing playlist
    else if (type === "optimize_existing") {
        User.updateSelected(req, function() {
            res.redirect(200, '/optimize');
        });
    }  
    // Finalizing a playlist optimization
    else if (type === "save_changes") {
        if (req.body['remove_song']) {
          this.remove_tracks(req);
        }
        if (req.body['add_song']) {
          this.add_tracks(req);
        }
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

// Returns boolean: whether a user has edit access to playlist
function has_access(user, playlist) {
    return ((playlist['owner']['id'] == user) || (playlist['collaborative']));
}

// Recursively find all playlists a user has edit access to
function check_playlists(id, collected_playlists, limit, offset, done) {
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
                        check_playlists(id, collected_playlists, 50, offset + 49, done);
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

// Initiate a refresh of a user's playlists
exports.update_playlists = function(req, res, next, callback) {
    check_playlists(req.user.id, [], 50, 0, function(collected_playlists) {
        User.updatePlaylists(req, collected_playlists, callback);
    });
}
