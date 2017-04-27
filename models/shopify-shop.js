'use strict'

var db = require('../db/db');

var FIND_BY_SHOP_QUERY= 'SELECT * FROM ShopifyShops WHERE shop = $1';

var INSERT_QUERY = [
  'INSERT INTO ShopifyShops (',
    'shop, shopify_access_token',
  ') VALUES ($1, $2) RETURNING id',
].join(' ');

var ADD_MAILCHIMP_TOKEN_QUERY = [
  'UPDATE ShopifyShops',
  'SET mailchimp_access_token = $1,',
  'mailchimp_api_endpoint = $2',
  'WHERE shop = $3;',
].join(' ');

var ShopifyShop = {
  create: function (shop, accessToken, callback) {
    var params = [shop, accessToken];

    db.query(INSERT_QUERY, params, function (err, results) {
      if (err) {
        console.log(err);
        return callback('Sorry, there was an error. Try again later.');
      }
      var accessTokenId = results.rows[0].id;

      callback(undefined, accessTokenId);
    });
  },

  addMailchimpAccessToken: function (shop, accessToken, apiEndpoint, callback) {
    db.query(ADD_MAILCHIMP_TOKEN_QUERY, [accessToken, apiEndpoint, shop], function (err) {
      if (err) return callback('Sorry, there was an error. Try again later.');
      callback(undefined);
    });
  },

  findByShop: function (shop, callback) {
    db.query(FIND_BY_SHOP_QUERY, [shop], function (err, results) {
      if (err) return callback(err);
      callback(undefined, results.rows[0]);
    });
  },
};

 module.exports = ShopifyShop;
