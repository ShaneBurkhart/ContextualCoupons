'use strict'

var ShopifyShop = require('../models/shopify-shop');

module.exports = function () {
  return function (req, res, next) {
    var shop = req.shop;
    if (!shop) {
      var message = 'You need to login to visit that page.'
      req.session.redirectAfterLoginPath = req.path;
      return res.redirect('/login?error=' + encodeURIComponent(message));
    }

    next();
  };
};
