const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const redis = require('redis');
const session = require('express-session');
const REDIS_KEY = require('./redis_session_cfg.js').REDIS_SECRET;
const bodyParser = require('body-parser');

const OPTIMIZE = require("./controllers/optimize.js");
const SUGGESTIONS = require('./controllers/suggestions.js');
const FUNCTIONS = require('./functions.js');

const welcomeRouter = require('./routes/welcome.js');
const spotifyRouter = require('./routes/spotify_auth.js');
const spotifyCallbackRouter = require('./routes/spotify_auth_callback.js');
const homeRouter = require('./routes/home.js');
const optimizeRouter = require('./routes/optimize.js');
const suggestionsRouter = require('./routes/suggestions.js');

let RedisStore = require('connect-redis')(session);

const app = express();
app.set('trust proxy', 1) // trust first proxy

let client = redis.createClient({
  host: 'localhost',
  port: 6379,
  //password: REDIS_KEY,
  db: 1
})
client.unref();
client.on('error', console.log)

app.use(session({
  store: new RedisStore({ client }),
  secret: REDIS_KEY,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  unset: 'destroy',
  cookie: { maxAge: 3600000, sameSite: true, secure: false, httpOnly: false } // 1 hr
}))

app.use(bodyParser.urlencoded({
  extended: false,
  parameterLimit: 4500
}));

app.use(bodyParser.json({ limit: '150mb' }));

var jsonParser = bodyParser.json();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(REDIS_KEY));
app.use(express.static(path.join(__dirname, 'public')));
var favicon = require('serve-favicon');
app.use(favicon(path.join(__dirname,'public','images','favicon.ico')));

app.use('/', welcomeRouter);
app.use('/spotify_auth', spotifyRouter);
app.use('/spotify_auth_callback', spotifyCallbackRouter);
app.use('/home', homeRouter);
app.use('/options', optimizeRouter);
app.use('/suggestions', suggestionsRouter);
app.use('/optimize', optimizeRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

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
