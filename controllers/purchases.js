'use strict'

var ActiveCampaign = require('activecampaign');
var stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
var activeCampaign = new ActiveCampaign(
  "https://sparkschool.api-us1.com",
  process.env.ACTIVE_CAMPAIGN_KEY
);

var TWITTER_CLONE_DESC = "Twitter Clone Course - Spark School";
var TWITTER_CLONE_PRICE = 900;

module.exports = function (app) {
  app.post('/:type/signup', function (req, res) {
    var type = req.params.type || 'complete-guide-to-becoming-a-software-developer';
    var email = req.body.email;
    var origin = req.body.origin || '/';
    var thankYouPage = '/complete-guide-to-becoming-a-software-developer-thank-you';

    if (!/\S+@\S+.\S+/.test(email)) {
      return res.redirect([
        origin,
        '?email=' + email,
        '&error=' + encodeURIComponent('That email is invalid.'),
        '#sign-up',
      ].join(''));
    }

    var contact = {
      'email': email,
    };

    switch (type) {
      case 'complete-guide-to-becoming-a-software-developer':
      default:
        contact['p[13]'] = '13';
        thankYouPage = '/complete-guide-to-becoming-a-software-developer-thank-you';
        break;
    }

    if (process.env.APP_ENV === 'development') contact.tags = 'development';

    var acCallback = function () {
      // This cookie shows tracking once and should be deleted when used.
      // This is safe since we always redirect to thank you page after setting
      // this cookie.
      res.cookie('sstrack', true, { httpOnly: true });

      res.redirect([
        thankYouPage,
        '?email=' + email,
      ].join(''));
    };

    activeCampaign.api('contact/add', contact).then(acCallback, acCallback);
  });

  app.post('/:product/purchase', function (req, res) {
    var product = req.params.product;
    var email = req.body.email;
    var origin = req.body.origin || '/';
    var stripeToken = req.body.stripeToken;
    var successRedirectURL = '/twitter-clone-course-thank-you';
    var contact = { 'email': email };
    var chargeOpts = {
      currency: 'usd',
      source: stripeToken,
      receipt_email: email,
    };

    if (!/\S+@\S+.\S+/.test(email)) {
      return res.redirect([
        origin,
        '?email=' + email,
        '&error=' + encodeURIComponent('That email is invalid.'),
        '#sign-up',
      ].join(''));
    }

    switch (product) {
      case 'twitter-clone':
      default:
        // Twitter clone list id
        contact['p[11]'] = '11';
        successRedirectURL = '/twitter-clone-course-thank-you';
        chargeOpts.description = TWITTER_CLONE_DESC;
        chargeOpts.amount = TWITTER_CLONE_PRICE;
        break;
    }

    var charge = stripe.charges.create(chargeOpts, function(err, charge) {
      if (err) {
        return res.redirect([
          origin,
          '?email=' + email,
          '&error=' + encodeURIComponent(err.message),
          '#sign-up',
        ].join(''));
      }

      var acCallback = function () {
        // This cookie shows tracking once and should be deleted when used.
        // This is safe since we always redirect to thank you page after setting
        // this cookie.
        res.cookie('sstrack', true, { httpOnly: true });

        res.redirect(successRedirectURL);
      };
      activeCampaign.api('contact/add', contact).then(acCallback, acCallback);
    });
  });
}
