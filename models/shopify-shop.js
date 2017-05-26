'use strict'

var db = require('../db/db');

var FIND_BY_SLUG_QUERY= 'SELECT * FROM ShopifyShops WHERE slug = $1';

var INSERT_QUERY = [
  'INSERT INTO ShopifyShops (',
    'slug, shopify_access_token',
  ') VALUES ($1, $2) RETURNING id',
].join(' ');

var UPSERT_QUERY = [
  'INSERT INTO ShopifyShops (',
    'slug, shopify_access_token',
  ') VALUES ($1, $2)',
  'ON CONFLICT (slug) DO UPDATE',
  'SET shopify_access_token = $2',
  'RETURNING id',
].join(' ');

var ADD_MAILCHIMP_TOKEN_QUERY = [
  'UPDATE ShopifyShops',
  'SET mailchimp_access_token = $1,',
  'mailchimp_api_endpoint = $2',
  'WHERE slug = $3;',
].join(' ');

var ShopifyShop = {
  create: function (slug, accessToken, callback) {
    var params = [slug, accessToken];

    db.query(INSERT_QUERY, params, function (err, results) {
      if (err) {
        console.log(err);
        return callback('Sorry, there was an error. Try again later.');
      }
      var shopId = results.rows[0].id;

      callback(undefined, shopId);
    });
  },

  upsert: function (slug, accessToken, callback) {
    var params = [slug, accessToken];

    db.query(UPSERT_QUERY, params, function (err, results) {
      if (err) {
        console.log(err);
        return callback('Sorry, there was an error. Try again later.');
      }
      var shopId = results.rows[0].id;

      callback(undefined, shopId);
    });
  },

  addMailchimpAccessToken: function (slug, accessToken, apiEndpoint, callback) {
    db.query(ADD_MAILCHIMP_TOKEN_QUERY, [accessToken, apiEndpoint, slug], function (err) {
      if (err) return callback('Sorry, there was an error. Try again later.');
      callback(undefined);
    });
  },

  findBySlug: function (slug, callback) {
    db.query(FIND_BY_SLUG_QUERY, [slug], function (err, results) {
      if (err) return callback(err);
      callback(undefined, results.rows[0]);
    });
  },
};

 module.exports = ShopifyShop;
