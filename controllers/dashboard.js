'use strict'

var _ = require("underscore");
var request = require("superagent");

var ShopifyDiscount = require('../models/shopify-discount');

var authShop = require('../middleware/auth-shop');

function getMailchimpLists(shop, callback) {
  request
    .get(shop.mailchimp_api_endpoint + '/3.0/lists')
    .set('Authorization', 'OAuth ' + shop.mailchimp_access_token)
    .set('Accept', 'application/json')
    .end(function (err, r) {
      if (err) return callback(err);
      callback(undefined, r.body.lists);
    });
}

module.exports = function (app) {
  app.get('/dashboard', authShop(), function (req, res, next) {
    ShopifyDiscount.findByShopId(req.shop.id, function (err, shopifyDiscounts) {
      if (err) return res.send(err);
      if (!shopifyDiscounts.length) return res.redirect('/dashboard/discounts/new');

      res.render('discounts/index', {
        shopifyDiscounts: shopifyDiscounts
      });
    });
  });

  app.get('/dashboard/discounts/new', function (req, res, next) {
    getMailchimpLists(req.shop, function (err, lists) {
      if (err) {
        console.log(err);
      }

      var mailchimpLists = _.map(lists, function (list) {
        return _.pick(list, 'id', 'name');
      });

      res.render('discounts/new', {
        mailchimpLists: mailchimpLists,
      });
    });
  });

  app.get('/dashboard/discounts/create', function (req, res, next) {
    // Set up webhook for list
    //    Create if doesn't exist for list
    // Add discount to db with:
    // - duration in days
    // - mailchimp list id
    // - name
    // - shop_id
    res.render('discounts/new');
  });
};
