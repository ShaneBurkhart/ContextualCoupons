'use strict'

var MAILCHIMP_OAUTH_REDIRECT_URL = process.env.APP_URL + "/mailchimp/auth/callback";
var MAILCHIMP_OAUTH_URL = [
  "https://login.mailchimp.com/oauth2/authorize",
  "?response_type=code",
  "&client_id=" + process.env.MAILCHIMP_CLIENT_ID,
  "&redirect_uri=" + encodeURIComponent(MAILCHIMP_OAUTH_REDIRECT_URL),
].join("")
var SHOPIFY_SHOP_COOKIE = 'shopify_shop';

var request = require("superagent");

var ShopifyShop = require('../models/shopify-shop');

module.exports = function (app) {
  app.get('/mailchimp/auth', function (req, res) {
    res.render('user/mailchimp-auth', {
      mailchimpOAuthURL: MAILCHIMP_OAUTH_URL
    });
  });

  app.get('/mailchimp/auth/callback', function (req, res) {
    var shop = req.session.shop;
    var code = req.query.code;

    if (!shop) {
      console.log('No shop supplied.');
      return res.redirect('/mailchimp/auth');
    }

    request
      .post("https://login.mailchimp.com/oauth2/token")
      .send([
        "code=" + code,
        "grant_type=authorization_code",
        "client_id=" + process.env.MAILCHIMP_CLIENT_ID,
        "client_secret=" + process.env.MAILCHIMP_CLIENT_SECRET,
        "redirect_uri=" + encodeURIComponent(MAILCHIMP_OAUTH_REDIRECT_URL),
      ].join("&"))
      .set('Accept', 'application/json')
      .end(function(err, r) {
        if (err || r.statusCode != 200) {
          console.log(err);
          console.log(r.body);
          return res.redirect('/mailchimp/auth');
        }

        ShopifyShop.addMailchimpAccessToken(shop, r.body.access_token, function (err) {
          if (err) return res.redirect('/mailchimp/auth');
          res.redirect('/dashboard');
        });
      });
  });
};
