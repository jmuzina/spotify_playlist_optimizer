var spotify_handler = require('../spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;
const CLASSES = require('../classes.js');
const FUNCTIONS = require('../functions.js');

exports.get_home = function(req, res, next) {
    console.log("ID: " + req.sessionID);

    //console.log("full session: IN GET_HOME() \n");
    //console.log(req.session);

    console.log("get_home req");
    console.log((req['sessionID']));

    res.render('home', { title: 'Spotify Playlist Optimizer', user: req.session.json});
}

exports.post_home = function(req, res, next) {
    if (req.body['type'] === "logout") {
        FUNCTIONS.logout(req, res);
    }
    else {
        FUNCTIONS.page_not_found(res);
    }
}