'use strict'

var db = require('../db/db');

var FIND_BY_SHOP_ID_QUERY= 'SELECT * FROM ShopifyDiscounts WHERE shop_id = $1';

var INSERT_QUERY = [
  'INSERT INTO ShopifyDiscounts (',
    'shop_id, name, mailchimp_list_id, type, value, duration',
  ') VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
].join(' ');

var ShopifyDiscount = {
  create: function (discount, callback) {
    var params = [
      discount.shop_id,
      discount.name,
      discount.mailchimp_list_id,
      discount.type,
      discount.value,
      discount.duration,
    ];

    db.query(INSERT_QUERY, params, function (err, results) {
      if (err) {
        console.log(err);
        return callback('Sorry, there was an error. Try again later.');
      }
      var accessTokenId = results.rows[0].id;

      callback(undefined, accessTokenId);
    });
  },

  findByShopId: function (shopId, callback) {
    db.query(FIND_BY_SHOP_ID_QUERY, [shopId], function (err, results) {
      if (err) return callback(err);
      callback(undefined, results.rows);
    });
  },
};

 module.exports = ShopifyDiscount;
