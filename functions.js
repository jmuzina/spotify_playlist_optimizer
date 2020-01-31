var spotify_handler = require('./spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('./classes.js');

exports.calls_needed = function(limit_per_call, n) {
    return Math.ceil(n / limit_per_call);
}

exports.create_playlist = function(req, res, name, private) {
    api_connection.createPlaylist(req.session.user, name, {'public': !private}).then(
        function(data) {
            songs_to_add = [];
            for (song in req.session.suggestions) {
                songs_to_add.push(req.session.suggestions[song]['uri']);
            }
            api_connection.addTracksToPlaylist(data.body['id'], songs_to_add).then(
                function(track_data) {
                    console.log("Playlist created and songs inserted successfully!");
                    res.render('home', { title: 'Spotify Playlist Optimizer', user: req.session.json, creation_success: true});
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

exports.remove_tracks = function(playlist, playlist_snapshot, tracks) {
    snapshot = { snapshot_id: playlist_snapshot };
    console.log("remove_tracks called, removing " + tracks.length + " tracks");
    for (track in tracks) {
        tracks[track] = {uri: "spotify:track:" + tracks[track]};
    }
    const NUM_REMOVE = tracks.length;
    const CALLS_NEEDED = this.calls_needed(100, NUM_REMOVE);

    for (var i = 0; i < CALLS_NEEDED; i = i + 1) {
        if (i === (CALLS_NEEDED - 1)) {
            api_connection.removeTracksFromPlaylist(playlist, tracks.slice(i * 100), snapshot).then(
                function (data) {
                    console.log("Tracks successfully removed!");
                },
                function (err) {
                    console.log("Error in removing tracks: ")
                    console.log(err);
                }
            )
        }
        else {
            api_connection.removeTracksFromPlaylist(playlist, tracks.slice((i * 100), ((i * 100) + 100)), snapshot).then(
                function (data) {
                    console.log("Tracks successfully removed!");
                },
                function (err) {
                    console.log("Error in removing tracks: ")
                    console.log(err);
                }
            )
        }
    }
}

exports.add_tracks = function (playlist, tracks) {
    console.log("add_tracks called, adding " + tracks.length + " tracks");
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
        res.send("Invalid get_image parameters: received: " + type + "<br> Please contact me at joe.muzina@gmail.com");
    }
}

exports.minimum_playlists = function(playlist_arr) {
    const MIN_PLAYLISTS = 1;
    if (playlist_arr.length < MIN_PLAYLISTS) {
        return false;
    }
    else return true;
}