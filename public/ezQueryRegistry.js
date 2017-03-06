const _ = require('lodash');
const module = require('ui/modules').get('kibana');

module.service('ezQueryRegistry', function (Private, indexPatterns) {
  class EzQueryRegistry {
    constructor() {
      this.count = 0;
      this.registry = {};
    }

    register(getQueryFunc) {
      const id = this.count++;
      this.registry[id] = getQueryFunc;
      const self = this;
      return function() {
        delete self.registry[id];
      }
    }

    buildQuery() {
      let query = '';
      _.forOwn(this.registry, function(getQueryFunc, visId) {
        const fragment = getQueryFunc();
        if (fragment && fragment.length > 0) {
          if (query.length !== 0) {
            query += ' AND ';
          }
          query += '(' + fragment + ')';
        }
      });
      return query;
    }
  }

  return new EzQueryRegistry();
});