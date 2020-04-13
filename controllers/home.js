const FUNCTIONS = require('../functions.js');
const APP = require('../app.js');

exports.get_home = function(req, res, next) {
    //console.log(req);
    if (req.session.limit) FUNCTIONS.default_session(req.session);
    if ((!req.session.playlist_created) && (!req.session.playlist_optimized)) {
        res.render('home', { title: 'Spotify Playlist Optimizer', user: req.user, version: APP.VERSION});
    }
    else if (req.session.playlist_optimized) {
        req.session.playlist_optimized = false;
        res.render('home', { title: 'Spotify Playlist Optimizer', user: req.user, optimization_success: true, version: APP.VERSION});
    }
    else {
        req.session.playlist_created = false;
        res.render('home', { title: 'Spotify Playlist Optimizer', user: req.user, creation_success: true, version: APP.VERSION});
    }
}

exports.post_home = function(req, res, next) {
    FUNCTIONS.post_handler(req, res, req.body['type']);
}