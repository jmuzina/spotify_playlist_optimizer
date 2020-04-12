const FUNCTIONS = require('../functions.js');

exports.get_home = function(req, res, next) {
    if (req.session.limit) FUNCTIONS.default_session(req.session);
    if ((!req.session.playlist_created) && (!req.session.playlist_optimized)) {
        res.render('home', { title: 'Spotify Playlist Optimizer', user: req.session.profile, pfp: req.session.pfp});
    }
    else if (req.session.playlist_optimized) {
        req.session.playlist_optimized = false;
        res.render('home', { title: 'Spotify Playlist Optimizer', user: req.session.profile, pfp: req.session.pfp, optimization_success: true});
    }
    else {
        req.session.playlist_created = false;
        res.render('home', { title: 'Spotify Playlist Optimizer', user: req.session.profile, pfp: req.session.pfp, creation_success: true});
    }
}

exports.post_home = function(req, res, next) {
    FUNCTIONS.post_handler(req, res, req.body['type']);
}