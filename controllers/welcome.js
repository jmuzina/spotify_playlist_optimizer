const FUNCTIONS = require('../functions.js');
const SQL = require('../mysql_cfg.js');

exports.get_welcome = function(req, res, next) {
  var query = "UPDATE playlist_optimizer.stats SET connections=connections+1"
  SQL.con.query(query, function(err, result) {
    if (err) throw err;
    else if (result) {
      console.log("[CONNECTION] " + req.connection.remoteAddress.substring(7));
    }
  })

  query = "SELECT connections FROM playlist_optimizer.stats";
  SQL.con.query(query, function(err, result) {
      if (err) throw err;
      else {
        if (!FUNCTIONS.logged_in(req.session)) {
          res.render('welcome', { title: 'Spotify Playlist Optimizer'});
        }
        else {
          FUNCTIONS.default_session(req.session);
          res.render('welcome', { title: 'Spotify Playlist Optimizer', user: req.session.json});  
        }
      } 
  })
}

exports.post_welcome = function(req, res, next) {
  FUNCTIONS.logout(req, res);
}