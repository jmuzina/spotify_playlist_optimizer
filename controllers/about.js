const FUNCTIONS = require('../functions.js');
const APP = require('../app.js');
const STATS = require('../models/stats.js');

exports.get_about = function(req, res, next) {
  STATS.find(function(err, obj) {
    FUNCTIONS.addCommas(obj, function(stats) {
      res.render('about', { title: 'Spotify Playlist Optimizer | About', user: req.user, version: APP.VERSION, stats: stats});
    })
  })
}

exports.post_about = function(req, res, next) {
  FUNCTIONS.post_handler(req, res, req.body['type']);
}