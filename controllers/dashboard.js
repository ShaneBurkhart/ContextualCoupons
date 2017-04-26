'use strict'

var authUser = require('../middleware/auth-user');

module.exports = function (app) {
  app.get('/dashboard', authUser(), function (req, res, next) {
    res.render('/login');
  });
};
