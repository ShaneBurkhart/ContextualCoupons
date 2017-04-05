'use strict'

module.exports = function (req, res, next) {
  var query = req.query || {};

  // SumoMe isn't URI encoding emails when sending them as GET vars.
  // We need to replace spaces with plus signs.
  if (query.email) query.email = query.email.replace(/ /g, '+');

  // Add to res.locals so it's accessible from our views.
  res.locals.currentUser = req.user;
  res.locals.currentPath = req.path;
  res.locals.currentQuery = query;
  res.locals.currentCookies = req.cookies || {};

  next()
};
