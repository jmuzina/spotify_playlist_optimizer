var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('../classes.js');
const FUNCTIONS = require('../functions.js');

exports.get_home = function(req, res, next) {
    if (!req.session.playlist_created) {
        res.render('home', { title: 'Spotify Playlist Optimizer', user: req.session.json});
    }
    else {
        res.render('home', { title: 'Spotify Playlist Optimizer', user: req.session.json, creation_success: true});
    }
}

exports.post_home = function(req, res, next) {
    FUNCTIONS.post_handler(req, res, req.body['type']);
}