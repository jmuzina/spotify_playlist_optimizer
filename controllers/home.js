const FUNCTIONS = require('../functions.js');

exports.get_home = function(req, res, next) {
    //console.log(req);
    if (req.session.limit) FUNCTIONS.default_session(req.session);
    if ((!req.session.playlist_created) && (!req.session.playlist_optimized)) {
        res.render('home', { title: 'Spotify Playlist Optimizer', user: req.user});
    }
    else if (req.session.playlist_optimized) {
        req.session.playlist_optimized = false;
        res.render('home', { title: 'Spotify Playlist Optimizer', user: req.user, optimization_success: true});
    }
    else {
        req.session.playlist_created = false;
        res.render('home', { title: 'Spotify Playlist Optimizer', user: req.user, creation_success: true});
    }
}

exports.post_home = function(req, res, next) {
    FUNCTIONS.post_handler(req, res, req.body['type']);
}