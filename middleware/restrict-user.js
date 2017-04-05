'use strict'

var User = require('../models/user');

module.exports = function (role) {
  return function (req, res, next) {
    console.log(role);
    var user = req.user;
    if (!user) return next();

    // No role means restrict any user
    if (!role) return res.redirect('/courses');

    switch (role) {
      case 'paid':
        if (user.status === 'paid') return res.redirect('/courses');
    }

    next();
  };
};
