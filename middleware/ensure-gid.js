'use strict'

var gidUtil = require('../util/gid.js');

// For routes that want to either ensure or set the ssgid cookie.
// Can later be expanded to be a middleware function factory and take
// a cookie name as a parameter. Make it work for any cookie/param combo.
module.exports = function (req, res, next) {
  var gidCookie = req.cookies.ssgid;
  var gidParam = req.query.gid || gidUtil.DEFAULT_PRICE_ID;

  if (!gidCookie || !gidUtil.PRICES[gidCookie]) {
    res.cookie('ssgid', gidParam, { httpOnly: true, maxAge: 2147483647 });
    req.cookies.ssgid = gidParam;
  }

  next();
};
