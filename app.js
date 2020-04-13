const APP_VERSION = exports.VERSION = "ALPHA V 1.2";
const express = require('express');
var session = require("express-session");
var passport = require('passport');
const mongoose = require('mongoose');
const MONGO_CFG = require('./mongo_cfg.js');
const CRYPTO = require('./crypto.js');
bodyParser = require("body-parser");
const app = express();
app.set('trust proxy', 1) // trust first proxy
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

//mongo connect
mongoose.connect(MONGO_CFG.credentials.uri, {useFindAndModify: false}, function() {
  console.log("Mongo connected!");
});

const redis = require('redis');

let RedisStore = require('connect-redis')(session);

let client = redis.createClient({
  host: 'localhost',
  port: 6379,
  //password: REDIS_KEY,
  db: 1
})
client.unref();
client.on('error', console.log)

const REDIS_KEY = require('./redis_session_cfg.js').REDIS_SECRET;

app.use(session({
  store: new RedisStore({ client }),
  secret: REDIS_KEY,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  unset: 'destroy',
  cookie: { maxAge: 3600000, sameSite: true, secure: false, httpOnly: false } // 1 hr
}))

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '150mb' }));
var jsonParser = bodyParser.json();
app.use(passport.initialize());
app.use(passport.session());
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

var SpotifyStrategy = require('./node_modules/passport-spotify/lib/passport-spotify/index').Strategy;

const OPTIMIZE = require("./controllers/optimize.js");
const SUGGESTIONS = require('./controllers/suggestions.js');
const FUNCTIONS = require('./functions.js');
const CLASSES = require("./classes.js");

var spotify_handler = require('./spotify_auth_handler.js');
var api_connection = spotify_handler.spotify_connection;

const SPOTIFY_CFG = require('./spotify_auth_cfg');
const welcomeRouter = require('./routes/welcome.js');
const spotifyRouter = require('./routes/spotify_auth.js');
const spotifyCallbackRouter = require('./routes/spotify_auth_callback.js');
const homeRouter = require('./routes/home.js');
const optimizeRouter = require('./routes/optimize.js');
const suggestionsRouter = require('./routes/suggestions.js');

// controllers
const callback_ctr = require('./controllers/spotify_auth_callback.js');
const WELCOME_CTR = require('./controllers/welcome.js');

User = require('./models/user.js');

// Add user to DB
passport.serializeUser(function(user, done) {
  done(null, user);
});

// Pull user from DB
passport.deserializeUser(function(user, done) {
  User.find({id: user.id}, function(err, obj) {
    done(err, obj);
  })
});

// Passport configuration
passport.use(
  new SpotifyStrategy(
    {
      clientID: SPOTIFY_CFG.CLIENT_ID,
      clientSecret: SPOTIFY_CFG.CLIENT_SECRET,
      callbackURL: "http://playlist-optimizer.joemuzina.com/spotify_auth_callback",
      passReqToCallback: true
    },
    function(req, accessToken, refreshToken, expires_in, profile, done) {
      // Create initial user state
      User.findOrCreate({
        id: profile.id, 
        displayName: profile.displayName, 
        profile_picture: FUNCTIONS.get_image(profile.photos, "profile_picture"), 
        keys: {access: CRYPTO.encrypt(accessToken), refresh: CRYPTO.encrypt(refreshToken)}, // Encrypted API keys
        playlists: null,
        suggestions: null,
        selected_playlist: null,
        playlist_optimized: false,
        playlist_created: false
      }, 
      function(err, user) {
        return done(err, user);
      })
    }
  )
)

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(REDIS_KEY));
var favicon = require('serve-favicon');
app.use(favicon(path.join(__dirname,'public','images','favicon.ico')));

app.get(
  '/spotify_auth',
  passport.authenticate('spotify', {
    scope: ["user-top-read", "playlist-read-private", "playlist-modify-private", "playlist-modify-public"],
    showDialog: false
  }),
  function(req, res) {
    // The request will be redirected to spotify for authentication, so this
    // function will not be called.
  }
);

app.get(
  '/spotify_auth_callback',
  passport.authenticate('spotify', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect(200, '/home');
  }
);

app.get('/', function(req, res, next) {
  console.log("[CONNECTION] " + req.connection.remoteAddress.substring(7));
  FUNCTIONS.default_session(req.session);
  res.render('welcome', { title: 'Spotify Playlist Optimizer', user: req.user, version: APP_VERSION});  
});

app.post('/', function(req, res, next) {
  FUNCTIONS.default_session(req.session);
  res.render('welcome', { title: 'Spotify Playlist Optimizer', user: req.user, version: APP_VERSION});
})

//app.use('/spotify_auth', spotifyRouter);
//app.use('/spotify_auth_callback', spotifyCallbackRouter);
app.use('/home', ensureAuthenticated, homeRouter);
app.use('/options', ensureAuthenticated, optimizeRouter);
app.use('/suggestions', ensureAuthenticated, suggestionsRouter);
app.use('/optimize', ensureAuthenticated, optimizeRouter);

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
port = 80;
app.listen(port);
console.log("Started sever on port " + port);


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  console.log("[ERROR] Sent user back to homepage due to authentication failure");
  res.redirect('/');
}