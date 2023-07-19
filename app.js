const APP_VERSION = exports.VERSION = "Playlist Optimizer";
const express = require('express');
var session = require("express-session");
var passport = require('passport');
const mongoose = require('mongoose');
const MONGO_CFG = require('./mongo_cfg.js');
const CRYPTO = require('./crypto.js');
var net = require('net');
var http = require('http');
const FUNCTIONS = require('./functions.js');
const SPOTIFY_CFG = require('./spotify_auth_cfg');
const logger = require('morgan');
var SpotifyStrategy = require('./node_modules/passport-spotify/lib/passport-spotify/index').Strategy;
const helmet = require('helmet');


var baseAddress = 8085;

bodyParser = require("body-parser");
const app = express();
app.set('trust proxy', 1) // trust first proxy
const path = require('path');
app.use(session({
    secret: SPOTIFY_CFG.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));
User = require('./models/user.js');

//mongo connect
mongoose.connect(MONGO_CFG.credentials.uri, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
  console.log("Mongo connected!");
  User.deleteAll(function() {
    console.log("All previous userdata deleted!");
  })
})

const welcomeRouter = require('./routes/welcome.js');
const aboutRouter = require('./routes/about.js');
const homeRouter = require('./routes/home.js');
const optimizeRouter = require('./routes/optimize.js');
const suggestionsRouter = require('./routes/suggestions.js');
const errorRouter = require('./routes/error.js');


app.use(passport.session());

app.use(bodyParser.urlencoded({ extended: false, parameterLimit: 2000 }));
app.use(bodyParser.json({ limit: '150mb' }));
var jsonParser = bodyParser.json();
app.use(passport.initialize());
app.use(passport.session());

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
      callbackURL: "https://spo.jmuzina.io/spotify_auth_callback",
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
        playlist_created: false,
        limit: 1,
        range: "short_term"
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
var favicon = require('serve-favicon');
app.use(favicon(path.join(__dirname,'public','images','favicon.ico')));

app.get(
  '/spotify_auth',
  passport.authenticate('spotify', {
    scope: SPOTIFY_CFG.USER_SCOPES,
    showDialog: false,
    callbackURL: SPOTIFY_CFG.REDIRECT_URI
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

// error handler
app.use(function(err, req, res, next) {
  console.log(err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  /*
  if (!req.secure) {
    console.log("redirecting to TLS");
    res.redirect('https://' + req.headers.host + req.url);
  }
  else if (err) {
    console.log("secure, error")
    // render the error page
    res.status(err.status || 500);
    res.redirect(200, '/error');
  }
  else {
    console.log("valid req");
    next();
  }
  */
  if (err) {
    res.status(err.status || 500);
    res.redirect(200, '/error');
  }
});

app.use('/', welcomeRouter);
app.use('/home', ensureAuthenticated, homeRouter);
app.use('/about', aboutRouter);
app.use('/options', ensureAuthenticated, optimizeRouter);
app.use('/suggestions', ensureAuthenticated, suggestionsRouter);
app.use('/optimize', ensureAuthenticated, optimizeRouter);
app.use('/error', errorRouter)

console.log("using helmet");

app.use(helmet());

module.exports = app;
http.createServer(app).listen(baseAddress).on('error', function(err) { console.log(err); });

//https.createServer(options, httpsConnection).listen(httpsAddress);

console.log("SPO launched on " + baseAddress);

// Make sure user is logged in on appropriate pages
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  User.deleteUser(req, function() {
    console.log("[ERROR] Sent user back to homepage due to authentication failure");
    res.redirect('/');
  })
}
