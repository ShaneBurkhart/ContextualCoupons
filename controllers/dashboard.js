'use strict'

var _ = require("underscore");
var async = require("async");
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

      var mailchimpLists = _.map(r.body.lists || [], function (list) {
        return _.pick(list, 'id', 'name');
      });

      callback(undefined, mailchimpLists);
    });
}

function getMailchimpAutomations(shop, callback) {
  request
    .get(shop.mailchimp_api_endpoint + '/3.0/automations')
    .set('Authorization', 'OAuth ' + shop.mailchimp_access_token)
    .set('Accept', 'application/json')
    .end(function (err, r) {
      if (err) return callback(err);

      var rawAutomations = r.body.automations || [];
      var mailchimpAutomations = _.map(rawAutomations, function (automation) {
        return {
          id: automation.id,
          title: automation.settings.title,
          list_id: automation.recipients.list_id,
       };
      });

      callback(undefined, mailchimpAutomations);
    });
}

module.exports = function (app) {
  app.get('/dashboard', authShop(), function (req, res, next) {
    var shop = req.shop;

    async.parallel([
      function (callback) { getMailchimpLists(shop, callback); },
      function (callback) { getMailchimpAutomations(shop, callback); },
    ], function (err, results) {
      if (err) return res.send(err);
      var mailchimpLists = results[0];
      var mailchimpAutomations = results[1];
      var indexedMailchimpAutomations = _.groupBy(mailchimpAutomations, 'list_id');

      ShopifyDiscount.findByShopId(shop.id, function (err, shopifyDiscount) {
        if (err) return res.send(err);

        res.render('discounts/index', {
          discount: shopifyDiscount,
          mailchimpLists: mailchimpLists,
          mailchimpAutomationsByListId: indexedMailchimpAutomations,
        });
      });
    });
  });

  app.post('/dashboard/discount/save', authShop(), function (req, res, next) {
    // Set up webhook for list
    //    Create if doesn't exist for list
    var shop = req.shop;
    var discount = {
      shop_id: shop.id,
      name: req.body.name,
      mailchimp_list_id: req.body.mailchimp_list_id,
      mailchimp_automation_id: req.body.mailchimp_automation_id,
      type: req.body.type,
      value: req.body.value,
      duration: req.body.duration,
    };

    async.parallel([
      function (callback) { getMailchimpLists(shop, callback); },
      function (callback) { getMailchimpAutomations(shop, callback); },
    ], function (err, results) {
      var mailchimpLists = results[0];
      var mailchimpAutomations = results[1];
      var indexedMailchimpAutomations = _.groupBy(mailchimpAutomations, 'list_id');

      ShopifyDiscount.upsert(discount, function (err, id, discount) {
        if (err) {
          return res.render('discounts/index', {
            err: err,
            discount: discount,
            mailchimpLists: mailchimpLists,
            mailchimpAutomationsByListId: indexedMailchimpAutomations,
          });
        }

        res.redirect('/dashboard');
      });
    });
  });
};
