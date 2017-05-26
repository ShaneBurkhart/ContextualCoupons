'use strict'

var ShopifyShop = require('../models/shopify-shop');

module.exports = function () {
  return function (req, res, next) {
    var shop = req.shop;

    if (!shop) {
      var message = 'You need to login to visit that page.'
      req.session.redirectAfterLoginPath = req.path;
      // TODO redirect to shopify app page
      return res.redirect('/login?error=' + encodeURIComponent(message));
    } else if (!shop.mailchimp_access_token && req.path.indexOf('/mailchimp/auth') < 0) {
      return res.redirect('/mailchimp/auth');
    }

    next();
  };
};
