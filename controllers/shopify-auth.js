'use strict'

var SHOPIFY_SCOPE = 'write_content';
var SHOPIFY_AUTH_REDIRECT_URI = 'http://127.0.0.1:8080/contextual-coupon/auth/callback';
var SHOPIFY_SHOP_COOKIE = 'shopify_shop';

var uuidV4 = require('uuid/v4');
var shopifyAPI = require('shopify-node-api');

var redis = require('../db/redis');

var ShopifyShop = require('../models/shopify-shop');

function getNonce(shop, callback) {
  if (!shop) callback('No shop supplied.');
  var redisKey = 'oauth-nonces:' + shop;

  redis.get(redisKey, function (err, reply) {
    if (err) callback(err);
    if (reply) return callback(undefined, reply);

    var newNonce = uuidV4();

    redis.set(redisKey, newNonce, function (err) {
      if (err) callback(err);
      callback(undefined, newNonce);
    });
  });
}

function getShopifyInstance(req, callback) {
  var shop = req.query.shop || '';

  getNonce(shop, function (err, nonce) {
    if (err) return callback(err);

    var shopifyClient = new shopifyAPI({
      shop: shop,
      shopify_api_key: process.env.SHOPIFY_API_KEY,
      shopify_shared_secret: process.env.SHOPIFY_SECRET_KEY,
      shopify_scope: SHOPIFY_SCOPE,
      redirect_uri: SHOPIFY_AUTH_REDIRECT_URI,
      nonce: nonce,
    });

    callback(undefined, shopifyClient);
  });
}

module.exports = function (app) {
  app.get('/contextual-coupon/install', function (req, res) {
    getShopifyInstance(req, function (err, client) {
      res.redirect(client.buildAuthURL());
    });
  });

  app.get('/contextual-coupon/auth/callback', function (req, res) {
    var queryParams = req.query;
    var shop = queryParams.shop || '';

    getShopifyInstance(req, function (err, client) {
      if (err)  {
        console.log(err);
          // TODO redirect to an unauthorized page
        return res.send(err);
      }

      client.exchange_temporary_token(queryParams, function(err, data){
        var authData = data || {};
        var accessToken = authData['access_token'];

        if (err) {
          // Unauthorized access.  Not from Shopify.
          console.log(err);
          // TODO redirect to an unauthorized page
          return res.send("Not authentic.");
        }

        ShopifyShop.create(shop, accessToken, function (err) {
          if (err) {
            console.log(err);
              // TODO redirect to an unauthorized page
            return res.send(err);
          }

          req.session.shop = shop;
          res.redirect('/mailchimp/auth');
        });
      });
    });
  });
};
