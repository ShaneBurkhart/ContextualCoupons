'use strict'

var User = require('../models/user');

module.exports = function (req, res, next) {
  var userId = req.cookies.ssuid;

  if (!userId) return next();

  User.findById(userId, function (err, user) {
    if (!user) return next();

    // Add to request so we can access in controllers.
    req.user = user;

    next();
  });
};
