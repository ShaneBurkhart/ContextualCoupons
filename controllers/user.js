'use strict'

var User = require('../models/user');

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
};
