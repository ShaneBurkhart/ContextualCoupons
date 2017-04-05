'use strict'

var db = require('../db/db');
var stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

var INSERT_QUERY = [
  'INSERT INTO Charges(',
    'user_id, amount, description, stripe_charge_id',
  ') VALUES ($1, $2, $3, $4) RETURNING id',
].join(' ');

var Charge = {
  chargeUser: function (user, price, callback) {
    var description = "Spark School SaaS Web App Course";

    var charge = stripe.charges.create({
      amount: price,
      currency: "usd",
      customer: user.stripe_customer_id,
      description: description,
    }, function(err, charge) {
      if (err) callback(err);
      var params = [user.id, price, description, charge.id];

      db.query(INSERT_QUERY, params, function (err, results) {
        if (err) callback(err);
        callback();
      });
    });
  },
};

module.exports = Charge;
