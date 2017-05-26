'use strict'

var SHOPIFY_SCOPE = 'write_content';
var SHOPIFY_AUTH_REDIRECT_URI = 'http://127.0.0.1:8080/contextual-coupon/auth/callback';

var uuidV4 = require('uuid/v4');
var shopifyAPI = require('shopify-node-api');

var redis = require('../db/redis');
var ShopifyUtil = require('../util/shopify');
var ShopifyShop = require('../models/shopify-shop');

function unsetShop(req) {
  req.session.shop = undefined;
}

function setShop(req, shop) {
  req.session.shop = shop;
}

module.exports = function (app) {
  app.get('/contextual-coupon/install', function (req, res) {
    var shopSlug = ShopifyUtil.getSlug(req.query.shop);
    var shop = req.shop;

    // Already logged in as this shop.
    if (shop && shop.slug == shopSlug) {
      // Ensure the session var is set.
      setShop(req, shopSlug);

      if (!shop.mailchimp_access_token) {
        // Shop authorized but not with Mailchimp
        // Go ahead and set shop to log in
        return res.redirect('/mailchimp/auth');
      } else {
        // Logged in and set up.
        return res.redirect('/dashboard');
      }
    }

    // Make sure to clear the session
    unsetShop(req);

    ShopifyUtil.getClientWithNonce(shopSlug, function (err, client) {
      if (err) return res.send(err);
      return res.redirect(client.buildAuthURL());
    });
  });

  app.get('/contextual-coupon/auth/callback', function (req, res) {
    var queryParams = req.query;
    var shopSlug = ShopifyUtil.getSlug(queryParams.shop);

    ShopifyUtil.getClientWithNonce(shopSlug, function (err, client) {
      if (err)  {
        console.log(err);
        // TODO redirect to an unauthorized page
        return res.send(err);
      }

      client.exchange_temporary_token(queryParams, function(err, data){
        var authData = data || {};
        var accessToken = authData['access_token'];

        if (err) {
          console.log(err);
          // Unauthorized access. Not from Shopify more than likely.
          return res.send(err);
        }

        ShopifyShop.upsert(shopSlug, accessToken, function (err, shopId) {
          if (err) return res.send(err);

          // Login shop
          setShop(req, shopSlug);

          ShopifyShop.findBySlug(shopSlug, function (err, shop) {
            if (!shop.mailchimp_access_token) {
              return res.redirect('/mailchimp/auth');
            } else {
              return res.redirect('/dashboard');
            }
          });
        });
      });
    });
  });
};
