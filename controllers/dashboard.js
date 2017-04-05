'use strict'

var authUser = require('../middleware/auth-user');

module.exports = function (app) {
  app.get('/', authUser(), function (req, res, next) {
    res.redirect('/login');
  });
};
