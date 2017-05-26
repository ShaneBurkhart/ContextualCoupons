'use strict'

var MailchimpUtil = require('../util/mailchimp');
var ShopifyShop = require('../models/shopify-shop');

var authShop = require('../middleware/auth-shop');

module.exports = function (app) {
  app.get('/mailchimp/auth', authShop(), function (req, res) {
    var shop = req.shop;

    // Already authorized with Mailchimp
    if (shop.mailchimp_access_token) return res.redirect('/dashboard');

    res.render('user/mailchimp-auth', {
      mailchimpOAuthURL: MailchimpUtil.MAILCHIMP_OAUTH_URL
    });
  });

  app.get(MailchimpUtil.MAILCHIMP_OAUTH_REDIRECT_URI, authShop(), function (req, res) {
    var code = req.query.code;

    MailchimpUtil.getAccessToken(code, function (err, accessToken) {
      if (err) return res.send(err);

      MailchimpUtil.getAPIEndpoint(accessToken, function (err, apiEndpoint) {
        if (err) return res.send(err);
        var shopSlug = req.shop.slug;

        ShopifyShop.addMailchimpAccessToken(shopSlug, accessToken, apiEndpoint, function (err) {
          if (err) return res.send(err);
          res.redirect('/dashboard');
        });
      });
    });
  });
};
