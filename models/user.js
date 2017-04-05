'use strict'

var ActiveCampaign = require('activecampaign');
var bcrypt = require('bcrypt');
var db = require('../db/db');
var Charge = require('./charge');
var stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
var activeCampaign = new ActiveCampaign(
  "https://sparkschool.api-us1.com",
  process.env.ACTIVE_CAMPAIGN_KEY
);

var DEFAULT_LIST_ID = 1;
var ACTIVE_CAMPAIGN_LISTS = {
  'saas-course': 5,
  'twitter-clone': 1,
}


// Bcrypt stuff
var SALT_ROUNDS = 10;

var FIND_BY_ID_QUERY= 'SELECT * FROM Users WHERE id = $1';
var FIND_BY_EMAIL_QUERY= 'SELECT * FROM Users WHERE email = $1';

var INSERT_QUERY = [
  'INSERT INTO Users(',
    'full_name, email, password_digest',
  ') VALUES ($1, $2, $3) RETURNING id',
].join(' ');

var User = {
  // Don't do password validation in here.
  validate: function (user, callback) {
    if (!user.full_name) return callback('You must enter a name.');
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

        var params = [user.full_name, user.email, hash];

        db.query(INSERT_QUERY, params, function (err, results) {
          if (err) return callback('Sorry, there was an error. Try again later.');
          var userId = results.rows[0].id;
          var listId = ACTIVE_CAMPAIGN_LISTS[type] || DEFAULT_LIST_ID;

          User.addToActiveCampaign(user, listId, function (err) {
            callback(undefined, userId);
          });
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

  addCustomerAndCharge: function (user, stripeToken, price, callback) {
    this.addCustomer(user, stripeToken, function (err, user) {
      if (err) return callback(err);

      Charge.chargeUser(user, price, function (err) {
        if (err) return callback(err);

        User.makePaid(user, function (err) {
          if (err) return callback(err);
          callback();
        });
      });
    });
  },

  addCustomer: function (user, stripeToken, callback) {
    var query = 'UPDATE Users SET stripe_customer_id = $1 WHERE id = $2';

    var customer = stripe.customers.create({
      card: stripeToken,
      email: user.email,
    }, function (err, customer) {
      if (err) return callback(err);

      user.stripe_customer_id = customer.id;

      var params = [user.stripe_customer_id, user.id];

      db.query(query, params, function (err, results) {
        if (err) return callback(err);
        callback(undefined, user);
      });
    });
  },

  makePaid: function (user, callback) {
    var query = 'UPDATE Users SET status = \'paid\' WHERE id = $1';

    db.query(query, [user.id], function (err, results) {
      if (err) {
        console.log(err);
        return callback('Sorry, there was an error. Try again later.');
      }

      User.addTagInActiveCampaign(user, 'paid', function (err) {
        callback();
      });
    });
  },

  addToActiveCampaign(user, listId, callback) {
    // For right now, we don't care if it handles error or not. We can add them later.
    var acCallback = function (result) { callback(); };
    var contact = {
      'email': user.email,
      ['p[' + listId + ']']: listId,
    };

    if (process.env.APP_ENV === 'development') contact.tags = 'development';

    activeCampaign.api('contact/add', contact).then(acCallback, acCallback);
  },

  addTagInActiveCampaign: function (user, tag, callback) {
    // For right now, we don't care if it handles error or not. We can add tags later.
    var acCallback = function (result) { callback(); };
    var contact = {
      'email': user.email,
      'tags': tag,
    };

    activeCampaign.api('contact/tag_add', contact).then(acCallback, acCallback);
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
