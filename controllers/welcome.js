const FUNCTIONS = require('../functions.js');
const APP = require('../app.js');

exports.get_welcome = function(req, res, next) {
  res.render('welcome', { title: 'Spotify Playlist Optimizer', user: req.user, version: APP.APP_VERSION});   
}

exports.post_welcome = function(req, res, next) {
  FUNCTIONS.logout(req, res);
}