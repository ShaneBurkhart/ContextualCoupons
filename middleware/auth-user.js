'use strict'

var User = require('../models/user');

module.exports = function (role) {
  return function (req, res, next) {
    var user = req.user;
    if (!user) {
      var message = 'You need to login to visit that page.'
      req.session.redirectAfterLoginPath = req.path;
      return res.redirect('/login?error=' + encodeURIComponent(message));
    }

    if (role) {
      switch (role) {
        case 'paid':
          if (user.status !== 'paid') return res.redirect('/saas-course/purchase');
      }
    }

    next();
  };
};
