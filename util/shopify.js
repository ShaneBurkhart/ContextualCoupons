'use strict'

var SHOPIFY_SCOPE = 'write_content';
var SHOPIFY_AUTH_REDIRECT_URI = 'http://127.0.0.1:8080/contextual-coupon/auth/callback';

var uuidV4 = require('uuid/v4');
var shopifyAPI = require('shopify-node-api');

var redis = require('../db/redis');

var ShopifyUtil = {
  getClient: function (shop, callback) {
    var shopifyClient = new shopifyAPI({
      shop: shop,
      shopify_api_key: process.env.SHOPIFY_API_KEY,
      shopify_shared_secret: process.env.SHOPIFY_SECRET_KEY,
      shopify_scope: SHOPIFY_SCOPE,
      redirect_uri: SHOPIFY_AUTH_REDIRECT_URI,
    });

    callback(undefined, shopifyClient);
  },

  getClientWithNonce: function (shop, callback) {
    ShopifyUtil.getNonce(shop, function (err, nonce) {
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
  },

  getNonce: function (shop, callback) {
    if (!shop) return callback('No shop provided.');
    var redisKey = 'oauth-nonces:' + shop;

    redis.get(redisKey, function (err, reply) {
      if (err) return callback(err);
      if (reply) return callback(undefined, reply);

      var newNonce = uuidV4();

      redis.set(redisKey, newNonce, function (err) {
        if (err) return callback(err);
        callback(undefined, newNonce);
      });
    });
  },

  // Not for authorization requests
  isValidSignature: function (req, callback) {
    var shop = req.query.shop;
    if (!shop) return callback('No shop provided.');

    ShopifyUtil.getClient(shop, function (err, client) {
      if (err) return callback(err);

      if (!client.is_valid_signature(req.query, true)) {
        return callback('Not a valid signature.');
      }

      callback();
    });
  }
};

module.exports = ShopifyUtil;
