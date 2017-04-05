'use strict'

var pg = require('pg');
var pool = new pg.Pool({
  user: 'sparkschool',
  password: 'password',
  host: 'db',
  database: 'sparkschool',
  max: 10, // max number of clients in pool
  idleTimeoutMillis: 1000, // close & remove clients which have been idle > 1 second
});

pool.on('error', function (e, client) {
  console.log('POSTGRES ERROR: ' + e.message);
  console.log(e);
});

module.exports = pool;
