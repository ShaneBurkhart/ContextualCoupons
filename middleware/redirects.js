'use strict'

// Site wide 301 redirect mappings.
// Generally used for backwards compatibility.
var REDIRECTS = {
  '/tutorials/build-and-deploy-nodejs-app-to-heroku': '/tutorials/build-and-deploy-nodejs-app-to-heroku/intro',
  '/become-a-software-developer-without-a-college-degree': 'become-a-software-developer-without-a-college-degree-weekly-email',
  '/the-full-guide-to-becoming-a-software-developer-cheat-sheet': '/the-full-guide-to-becoming-a-software-developer',
  '/the-full-guide-to-becoming-a-software-developer-nodejs-tutorial': '/the-full-guide-to-becoming-a-software-developer',

  // Move project-2 to twitter-clone routes
  '/project-2-course': '/twitter-clone-course',
  '/project-2-course-checkout': '/twitter-clone-course-checkout',
  '/project-2-course-24-hour-sale': '/twitter-clone-course-24-hour-sale',
  '/project-2-course-24-hour-sale-checkout': '/twitter-clone-course-24-hour-sale-checkout',
  '/become-a-software-developer-project-2': '/twitter-clone-course',

  // Get rid of 24 hour sale for twitter clone course
  '/twitter-clone-course-24-hour-sale': '/twitter-clone-course',
  '/twitter-clone-course-24-hour-sale-checkout': '/twitter-clone-course-checkout',
};

module.exports = function (req, res, next) {
  var path = req.path.replace(/\/$/, '');
  var redirect = REDIRECTS[path];

  if (redirect) return res.redirect(redirect);

  next();
};
