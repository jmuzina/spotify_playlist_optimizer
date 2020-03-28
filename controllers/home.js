const FUNCTIONS = require('../functions.js');

exports.get_home = function(req, res, next) {
    console.log("get home called");
    if (FUNCTIONS.logged_in(req.session)) {
        if (req.session.limit) FUNCTIONS.default_session(req.session);
        if ((!req.session.playlist_created) && (!req.session.playlist_optimized)) {
            res.render('home', { title: 'Spotify Playlist Optimizer', user: req.session.json});
        }
        else if (req.session.playlist_optimized) {
            req.session.playlist_optimized = false;
            res.render('home', { title: 'Spotify Playlist Optimizer', user: req.session.json, optimization_success: true});
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