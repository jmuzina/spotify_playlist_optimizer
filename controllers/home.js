var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('../classes.js');
const FUNCTIONS = require('../functions.js');

exports.get_home = function(req, res, next) {
    if (FUNCTIONS.logged_in(req.session)) {
        if (!req.session.playlist_created) {
            res.render('home', { title: 'Spotify Playlist Optimizer', user: req.session.json});
        }
        else {
            req.session.playlist_created = false;
            res.render('home', { title: 'Spotify Playlist Optimizer', user: req.session.json, creation_success: true});
        }
    }
    else { // User not logged in, re_auth
        FUNCTIONS.re_auth(req, res, next);
    }
    
}

exports.post_home = function(req, res, next) {
    FUNCTIONS.post_handler(req, res, req.body['type']);
}