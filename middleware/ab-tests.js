'use strict'

var fs = require('fs');
var path = require('path');
var async = require('async');
var _ = require('underscore');
var uuidV4 = require('uuid/v4');
var sixpack = require('sixpack-client');
var yaml = require('js-yaml');

var AB_CLIENT_ID_COOKIE = 'ssab';

var AB_TEST_DIRECTORY = path.resolve(__dirname, '../tests/ab');
var AB_TEST_FILES = fs.readdirSync(AB_TEST_DIRECTORY);

var TESTS = [];
var TESTS_BY_PATH = {};
var TESTS_BY_CONVERSION_PATH = {};

// Load test files
_.each(AB_TEST_FILES, function (file) {
  var absolutePath = path.join(AB_TEST_DIRECTORY, file);
  var tests = yaml.load(fs.readFileSync(absolutePath, 'utf8'));
  if (tests) TESTS = TESTS.concat(tests);
});

// Index test files accounting for path/paths, etc.
_.each(TESTS, function (test) {
  function addPath(testsByPath, path, test) {
    testsByPath[path] = testsByPath[path] || [];
    testsByPath[path].push(test);
  }

  // Index by path or all paths
  if (test.paths) {
    _.each(test.paths, function (path) { addPath(TESTS_BY_PATH, path, test); })
  } else {
    addPath(TESTS_BY_PATH, test.path, test);
  }

  // Index by conversion path
  addPath(TESTS_BY_CONVERSION_PATH, test.conversion_path, test);
});

function getSession(req, res) {
  var clientId = req.cookies[AB_CLIENT_ID_COOKIE] || uuidV4();
  res.cookie(AB_CLIENT_ID_COOKIE, clientId);

  return new sixpack.Session({
    client_id: clientId,
    base_url: 'http://sixpack.trysparkschool.com:5000',
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
  });
}

// Loads tests for various routes and adds their values to template variables.
module.exports = function (req, res, next) {
  var query = req.query || req.body;
  var path = req.path.replace(/\/$/, '');
  var abSession = getSession(req, res);
  var currentPathTests = TESTS_BY_PATH[path];
  var currentPathConversions = TESTS_BY_CONVERSION_PATH[path];

  res.locals.abTests = res.locals.abTests || {};

  async.parallel([
    function loadTests(loadTestsCallback) {
      async.each(currentPathTests, function loadTest(test, loadTestCallback) {
        abSession.participate(test.name, test.alternatives, query['sixpack_force_' + test.name], function (err, sixpackRes) {
          if (err) console.log(err);

          var alternative = test.alternatives[0];
          if (!err) alternative = sixpackRes.alternative.name;

          // Translate "null" value to blank string
          if (alternative === 'null') alternative = '';
          // Translate "true" and "false" values to booleans
          if (alternative === 'true') alternative = true;
          if (alternative === 'false') alternative = false;

          res.locals.abTests[test.name] = alternative;
          loadTestCallback();
        });
      }, loadTestsCallback);
    },

    function convertTests(convertTestsCallback) {
      async.each(currentPathConversions, function convertTest(test, convertTestCallback) {
        abSession.convert(test.name, function (err, res) { convertTestCallback(); });
      }, convertTestsCallback);
    },
  ], function (err) {
    next();
  });
};
