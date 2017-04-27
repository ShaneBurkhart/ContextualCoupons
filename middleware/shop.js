'use strict'

var ShopifyShop = require('../models/shopify-shop');

module.exports = function (req, res, next) {
  var shopName = req.session.shop;

  if (!shopName) return next();

  ShopifyShop.findByShop(shopName, function (err, shop) {
    if (!shop) return next();

    // Add to request so we can access in controllers.
    req.shop = shop;

    next();
  });
};
