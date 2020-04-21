const FUNCTIONS = require('../functions.js');
const APP = require('../app.js');

exports.get_about = function(req, res, next) {
    res.render('about', { title: 'Spotify Playlist Optimizer | About', user: req.user, version: APP.VERSION});  
}

exports.post_about = function(req, res, next) {
  FUNCTIONS.post_handler(req, res, req.body['type']);
}