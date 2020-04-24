const APP = require('../app.js');
const FUNCTIONS = require('../functions.js');

exports.get_error = function(req, res, next) {
    res.render('error', { title: 'Spotify Playlist Optimizer | Page not Found!', user: req.user, version: APP.VERSION});  
}

exports.post_error = function(req, res, next) {
  FUNCTIONS.post_handler(req, res);
}