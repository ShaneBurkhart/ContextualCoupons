'use strict'

var redis = require('redis');
var client = redis.createClient({
  host: 'redis',
  port: 6379,
});

module.exports = client;
