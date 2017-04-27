'use strict'

var MAILCHIMP_OAUTH_REDIRECT_URI = "/mailchimp/auth/callback";
var MAILCHIMP_OAUTH_REDIRECT_URL = process.env.APP_URL + MAILCHIMP_OAUTH_REDIRECT_URI;
var MAILCHIMP_OAUTH_URL = [
  "https://login.mailchimp.com/oauth2/authorize",
  "?response_type=code",
  "&client_id=" + process.env.MAILCHIMP_CLIENT_ID,
  "&redirect_uri=" + encodeURIComponent(MAILCHIMP_OAUTH_REDIRECT_URL),
].join("")

var request = require("superagent");

var MailchimpUtil = {
  MAILCHIMP_OAUTH_REDIRECT_URI: MAILCHIMP_OAUTH_REDIRECT_URI,
  MAILCHIMP_OAUTH_URL: MAILCHIMP_OAUTH_URL,

  getAccessToken: function (tempToken, callback) {
    request
      .post("https://login.mailchimp.com/oauth2/token")
      .send([
        "code=" + tempToken,
        "grant_type=authorization_code",
        "client_id=" + process.env.MAILCHIMP_CLIENT_ID,
        "client_secret=" + process.env.MAILCHIMP_CLIENT_SECRET,
        "redirect_uri=" + encodeURIComponent(MAILCHIMP_OAUTH_REDIRECT_URL),
      ].join("&"))
      .set('Accept', 'application/json')
      .end(function(err, r) {
        if (err || r.statusCode != 200)  return callback(err || r.body);
        callback(undefined, r.body.access_token);
      });
  },

  getAPIEndpoint: function (accessToken, callback) {
    request
      .post("https://login.mailchimp.com/oauth2/metadata")
      .set('Accept', 'application/json')
      .set('Authorization', 'OAuth ' + accessToken)
      .end(function(err, r) {
        if (err || r.statusCode != 200) {
          console.log(err);
          console.log(r.body);
          return callback(err);
        }

        callback(undefined, r.body.api_endpoint);
      });
  }
};

module.exports = MailchimpUtil;
