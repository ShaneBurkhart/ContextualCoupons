'use strict'

var db = require('../db/db');

var FIND_BY_SHOP_ID_QUERY= 'SELECT * FROM ShopifyDiscounts WHERE shop_id = $1 LIMIT 1';

var INSERT_QUERY = [
  'INSERT INTO ShopifyDiscounts (',
    'shop_id, name, mailchimp_list_id, mailchimp_automation_id, type, value, duration',
  ') VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
].join(' ');

var UPSERT_QUERY = [
  'INSERT INTO ShopifyDiscounts (',
    'shop_id, name, mailchimp_list_id, mailchimp_automation_id, type, value, duration',
  ') VALUES ($1, $2, $3, $4, $5, $6, $7)',
  'ON CONFLICT (shop_id) DO UPDATE',
  'SET name = $2,',
  'mailchimp_list_id = $3,',
  'mailchimp_automation_id = $4,',
  'type = $5,',
  'value = $6,',
  'duration = $7',
].join(' ');

var ShopifyDiscount = {
  validate: function (discount, callback) {
    var attrErrors = {};
    var error;

    if (!discount) return callback('Invalid discount.');

    if (!discount.shop_id) {
      attrErrors.shop_id = 'No shop ID.';
      error = 'Invalid discount.';
    }

    if (!discount.name) {
      attrErrors.name = 'Your discount needs a name.';
      error = 'Your discount has errors.';
    }

    if (!discount.mailchimp_list_id) {
      attrErrors.mailchimp_list_id = 'You need to select a Mailchimp list.';
      error = 'Your discount has errors.';
    }

    if (!discount.mailchimp_automation_id) {
      attrErrors.mailchimp_automation_id = 'You need to select a Mailchimp automation to trigger.';
      error = 'Your discount has errors.';
    }

    if (!discount.type) {
      attrErrors.type = 'You need to select a discount type.';
      error = 'Your discount has errors.';
    }

    if (!discount.value) {
      attrErrors.value = 'You need to enter a discount value.';
      error = 'Your discount has errors.';
    }

    if (!discount.duration) {
      attrErrors.duration = 'You need to select a discount duration.';
      error = 'Your discount has errors.';
    }

    if (error) {
      // Attach errors to model so we can render them.
      discount.attrErrors = attrErrors;
      return callback(error, discount);
    } else {
      return callback(undefined, discount);
    }
  },

  create: function (discount, callback) {
    var params = [
      discount.shop_id,
      discount.name,
      discount.mailchimp_list_id,
      discount.type,
      discount.value,
      discount.duration,
    ];

    ShopifyDiscount.validate(discount, function (err, discount) {
      // Return discount for errors
      if (err) return callback(err, undefined, discount);

      db.query(INSERT_QUERY, params, function (err, results) {
        if (err) {
          console.log(err);
          return callback('Sorry, there was an error. Try again later.');
        }

        var discountId = results.rows[0].id;
        discount.id = discountId;

        callback(undefined, discountId, discount);
      });
    });
  },

  upsert: function (discount, callback) {
    var params = [
      discount.shop_id,
      discount.name,
      discount.mailchimp_list_id,
      discount.mailchimp_automation_id,
      discount.type,
      discount.value,
      discount.duration,
    ];

    ShopifyDiscount.validate(discount, function (err, discount) {
      // Return discount for errors
      if (err) return callback(err, undefined, discount);

      db.query(UPSERT_QUERY, params, function (err, results) {
        if (err) {
          console.log(err);
          return callback('Sorry, there was an error. Try again later.');
        }

        var discountId = results.rows[0].id;
        discount.id = discountId;

        callback(undefined, discountId, discount);
      });
    });
  },

  findByShopId: function (shopId, callback) {
    db.query(FIND_BY_SHOP_ID_QUERY, [shopId], function (err, results) {
      if (err) return callback(err);
      callback(undefined, results.rows[0]);
    });
  },
};

 module.exports = ShopifyDiscount;
