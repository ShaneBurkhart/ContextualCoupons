'use strict'

module.exports = {
  PageNotFoundError: function(path) {
    this.name = 'PageNotFoundError';
    this.message = 'Couldn\'t find page: ' + path;
  },
};
