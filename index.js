'use strict'

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var express = require('express');
var app = express();
var redisStore = new RedisStore({
  host: 'redis',
  port: 6379,
});

var db = require('./db/db');
var addControllers = require('./controllers/index');
var errorUtil = require('./util/error');

app.engine('html', require('pug').renderFile);
app.set('views', './views');
app.set('view engine', 'pug');

app.use(require('./middleware/redirects'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  name: 'sssid',
  store: redisStore,
  secret: process.env.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use(require('./middleware/user'));
// These needs to be last to make sure variables are set.
app.use(require('./middleware/ab-tests'));
app.use(require('./middleware/template-vars'));

addControllers(app);

// Catch 404
app.use(function (req, res, next) {
  next(new errorUtil.PageNotFoundError(req.path));
});

app.use(function (err, req, res, next) {
  if (!err) return next();

  console.log(err.message);

  switch(err.name) {
    case 'PageNotFoundError':
      return res.status(404).render('404');
    default:
      return res.status(500).send('There was an internal error.');
  }

  next();
});

app.listen(80, function () {
  console.log('Listening on port 8080');
});
