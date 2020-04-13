const FUNCTIONS = require('../functions.js');
const APP = require('../app.js');
const User = require('../models/user.js');

exports.get_home = function(req, res, next) {
    if (req.session.limit) FUNCTIONS.default_session(req.session);
    if ((!req.user.playlist_created) && (!req.user.playlist_optimized)) {
        res.render('home', { title: 'Spotify Playlist Optimizer', user: req.user, version: APP.VERSION});
    }
    else if (req.user.playlist_optimized) {
        User.updateOptimized(req, false, function() {
            res.render('home', { title: 'Spotify Playlist Optimizer', user: req.user, optimization_success: true, version: APP.VERSION});
        })
    }
    else {
        User.updateCreated(req, false, function() {
            res.render('home', { title: 'Spotify Playlist Optimizer', user: req.user, creation_success: true, version: APP.VERSION});
        }) 
    }
}

exports.post_home = function(req, res, next) {
    FUNCTIONS.post_handler(req, res, req.body['type']);
}