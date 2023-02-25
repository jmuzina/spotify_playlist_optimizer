const APP_VERSION = exports.VERSION = "Playlist Optimizer";
const express = require('express');
var session = require("express-session");
var passport = require('passport');
const mongoose = require('mongoose');
const MONGO_CFG = require('./mongo_cfg.js');
const CRYPTO = require('./crypto.js');
var net = require('net');
var http = require('http');

const https = require("https"),
  fs = require("fs"),
  helmet = require("helmet");

const options = {
  key: fs.readFileSync("/etc/letsencrypt/live/joemuzina.com-0001/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/joemuzina.com-0001/fullchain.pem"),
//  dhparam: fs.readFileSync("/etc/letsencrypt/live/portfolio.joemuzina.com/dh-strong.pem")
};

var baseAddress = 8080;
var redirectAddress = 8081;
var httpsAddress = 8082;

function tcpConnection(conn) {
  conn.once('data', function (buf) {
      // A TLS handshake record starts with byte 22.
      var address = (buf[0] === 22) ? httpsAddress : redirectAddress;
      var proxy = net.createConnection(address, function () {
          proxy.write(buf);
          conn.pipe(proxy).pipe(conn);
      });
  });
}

function httpConnection(req, res) {
  var host = req.headers['host'];
  res.writeHead(301, { "Location": "https://" + host + req.url });
  res.end();
}

function httpsConnection(req, res) {
  res.writeHead(200, { 'Content-Length': '5' });
  res.redirect(200, 'https://' + req.headers.host + req.url);

}

bodyParser = require("body-parser");
const app = express();
app.set('trust proxy', 1) // trust first proxy
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
User = require('./models/user.js');

//mongo connect
mongoose.connect(MONGO_CFG.credentials.uri, {useFindAndModify: false, useNewUrlParser: true, useUnifiedTopology: true}, function() {
  console.log("Mongo connected!");
  User.deleteAll(function() {
    console.log("All previous userdata deleted!");
  })
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

app.use(bodyParser.urlencoded({ extended: false, parameterLimit: 2000 }));
app.use(bodyParser.json({ limit: '150mb' }));
var jsonParser = bodyParser.json();
app.use(passport.initialize());
app.use(passport.session());
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

var SpotifyStrategy = require('./node_modules/passport-spotify/lib/passport-spotify/index').Strategy;

const FUNCTIONS = require('./functions.js');

const SPOTIFY_CFG = require('./spotify_auth_cfg');
const welcomeRouter = require('./routes/welcome.js');
const aboutRouter = require('./routes/about.js');
const homeRouter = require('./routes/home.js');
const optimizeRouter = require('./routes/optimize.js');
const suggestionsRouter = require('./routes/suggestions.js');
const errorRouter = require('./routes/error.js');

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
      callbackURL: "https://joemuzina.com:8080/spotify_auth_callback",
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
https.createServer(options, app).listen(httpsAddress).on('error', function(err) { console.log(err); });

net.createServer(tcpConnection).listen(baseAddress);
http.createServer(httpConnection).listen(redirectAddress).on('error', function(err) { console.log(err); });
//https.createServer(options, httpsConnection).listen(httpsAddress);

console.log("SPO launched on " + baseAddress, redirectAddress, httpsAddress);

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
