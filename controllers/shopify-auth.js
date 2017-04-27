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
    var shop = req.query.shop;

    ShopifyUtil.isValidSignature(req, function (err) {
      if (err) return res.render(err);

      // Check if shop exists
      ShopifyShop.findByShop(shop, function (err, shopifyShop) {
        if (err) return res.render(err);

        if (!shopifyShop) {
          // No shop so authorize shop with shopify
          // Unset shop since we are authorizing a new one
          unsetShop(req)

          ShopifyUtil.getClientWithNonce(shop, function (err, client) {
            if (err) return res.render(err);
            res.redirect(client.buildAuthURL());
          });
        } else if (!shopifyShop.mailchimp_access_token) {
          // Shop authorized but not with Mailchimp
          // Go ahead and set shop to log in
          setShop(req, shop);
          res.redirect('/mailchimp/auth');
        } else {
          // Authorized with shopify and mailchimp
          // Login and redirect to dashboard
          setShop(req, shop);
          res.redirect('/dashboard');
        }
      });
    });
  });

  app.get('/contextual-coupon/auth/callback', function (req, res) {
    var queryParams = req.query;
    var shop = queryParams.shop;

    ShopifyUtil.getClientWithNonce(shop, function (err, client) {
      if (err)  {
        console.log(err);
          // TODO redirect to an unauthorized page
        return res.send(err);
      }

      client.exchange_temporary_token(queryParams, function(err, data){
        var authData = data || {};
        var accessToken = authData['access_token'];

        if (err) {
          // Unauthorized access. Not from Shopify more than likely.
          return res.send(err);
        }

        ShopifyShop.create(shop, accessToken, function (err) {
          if (err) return res.send(err);

          // Login and redirect to mailchimp auth
          setShop(req, shop);
          res.redirect('/mailchimp/auth');
        });
      });
    });
  });
};
