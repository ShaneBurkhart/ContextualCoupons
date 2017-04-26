'use strict'

module.exports = function (app) {
  require('./auth.js')(app);
  //require('./user.js')(app);
  //require('./dashboard.js')(app);
  // MAKE SURE THE HOME CONTROLLER GETS ADDED LAST!
  // The last route in the home controller catches all routes to check
  // them against existing landing pages.
  //require('./home.js')(app);
};
