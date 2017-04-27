'use strict'

module.exports = function (app) {
  app.post('/mailchimp/:shop_id/webhook', function (req, res, next) {
    console.log(req.body);
    res.send(req.body);
  });
};
