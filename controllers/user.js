'use strict'

var User = require('../models/user');
var gidUtil = require('../util/gid');
var authUser = require('../middleware/auth-user');
var restrictUser = require('../middleware/restrict-user');
var ensureGid = require('../middleware/ensure-gid');

function login(res, userId) {
  res.cookie('ssuid', userId, { httpOnly: true });
}

function logout(res) {
  res.clearCookie('ssuid');
}

module.exports = function (app) {
  app.get('/login', function (req, res) {
    var email = req.query.email || '';
    var error = req.query.error || '';

    res.render('user/login', { email: email, error: error });
  });

  app.post('/user/session/create', function (req, res) {
    var submittedUser = { email: req.body.email };
    var password = req.body.password;
    var redirectUrl = req.session.redirectAfterLoginPath;

    // Delete after we are done with redirect url
    delete req.session.redirectAfterLoginPath;

    User.checkPassword(submittedUser, password, function (err, user) {
      if (err) return res.render('user/login', { user: submittedUser, error: err });

      login(res, user.id);

      return res.redirect(redirectUrl || '/courses');
    });
  });

  app.post('/user/session/destroy', function (req, res) {
    logout(res);
    res.redirect('/login');
  });

  app.get('/signup', function (req, res) {
    res.render('user/new', { type: 'saas-course' });
  });

  app.post(['/user/create', '/user/:type/create'], function (req, res) {
    var type = req.params.type;
    var user = {
      full_name: req.body.full_name,
      email: req.body.email,
      password: req.body.password,
    };

    User.create(user, type, function (err, id) {
      if (err) {
        return res.render('user/new', { user: user, type: type, error: err });
      }

      login(res, id);

      switch (type) {
        case 'saas-course': return res.redirect('/saas-course/purchase');
        case 'twitter-clone': return res.redirect('/courses/twitter-clone/1/1');
        default: return res.redirect('/courses');
      }
    });
  });

  app.get('/saas-course/purchase', authUser(), restrictUser('paid'), ensureGid, function (req, res) {
    var gidCookie = req.cookies.ssgid;
    var priceInCents = gidUtil.PRICES[gidCookie] || gidUtil.PRICES[gidUtil.DEFAULT_PRICE_ID];

    res.render('user/saas-course-purchase', {
      stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
      price: Math.floor(priceInCents / 100),
    });
  });

  app.post('/saas-course/purchase', authUser(), restrictUser('paid'), ensureGid, function (req, res) {
    var stripeToken = req.body.stripeToken;
    var gidCookie = req.cookies.ssgid;
    var priceInCents = gidUtil.PRICES[gidCookie] || gidUtil.PRICES[gidUtil.DEFAULT_PRICE_ID];
    var user = req.user;

    User.addCustomerAndCharge(user, stripeToken, priceInCents, function (err) {
      if (err) {
        console.log(err);
        // TODO add error to query.
        return res.redirect('/saas-course/purchase');
      }

      res.redirect('/courses');
    });
  });
};
