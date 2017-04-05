'use strict'

var bcrypt = require('bcrypt');
var db = require('../db/db');
//
// Bcrypt stuff
var SALT_ROUNDS = 10;

var FIND_BY_ID_QUERY= 'SELECT * FROM Users WHERE id = $1';
var FIND_BY_EMAIL_QUERY= 'SELECT * FROM Users WHERE email = $1';

var INSERT_QUERY = [
  'INSERT INTO Users(',
    'email, password_digest',
  ') VALUES ($1, $2) RETURNING id',
].join(' ');

var User = {
  // Don't do password validation in here.
  validate: function (user, callback) {
    if (!user.email) return callback('You must enter an email address.');

    if (!/\S+@\S+.\S+/.test(user.email)) {
      return callback('You must enter a valid email address.');
    }

    this.findByEmail(user.email, function (err, user) {
      if (err) return callback('Sorry, there was an error. Try again later.');

      if (user) return callback('That email is already taken.');

      // Valid user
      return callback();
    });
  },

  validatePassword: function (password) {
    var MIN_PASSWORD_LENGTH = 8;
    var LENGTH_ERROR = 'Your password must be at least 8 characters.';
    var CONTENT_ERROR = 'Your password must contain at least one letter and number.';

    if (!password || password.length < MIN_PASSWORD_LENGTH) return LENGTH_ERROR;
    if (!/[a-zA-Z]/.test(password)) return CONTENT_ERROR;
    if (!/[0-9]/.test(password)) return CONTENT_ERROR;
    // Symbol list: ~`!@#$%^&*()+=_-{}[]\|:;”’?/<>,.
  },

  create: function (user, type, callback) {
    this.validate(user, function (err) {
      if (err) return callback(err);

      var passwordError = User.validatePassword(user.password);
      if (passwordError) return callback(passwordError);

      bcrypt.hash(user.password, SALT_ROUNDS, function (err, hash) {
        if (err) return callback('Sorry, there was an error. Try again later.');

        var params = [user.email, hash];

        db.query(INSERT_QUERY, params, function (err, results) {
          if (err) return callback('Sorry, there was an error. Try again later.');
          var userId = results.rows[0].id;

          callback(undefined, userId);
        });
      });
    });
  },

  checkPassword: function (user, password, callback) {
    this.findByEmail(user.email, function (err, user) {
      if (err || !user) return callback('Invalid email and password combination.');

      bcrypt.compare(password, user.password_digest, function (err, res) {
        if (err || !res) return callback('Invalid email and password combination.');
        callback(undefined, user);
      });
    });
  },

  findById: function (id, callback) {
    db.query(FIND_BY_ID_QUERY, [id], function (err, results) {
      callback(err, results.rows[0]);
    });
  },

  findByEmail: function (email, callback) {
    db.query(FIND_BY_EMAIL_QUERY, [email], function (err, results) {
      callback(err, results.rows[0]);
    });
  },
};

module.exports = User;
