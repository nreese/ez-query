const _ = require('lodash');
const module = require('ui/modules').get('kibana');

module.service('ezQueryRegistry', function (Private, indexPatterns) {
  class EzQueryRegistry {
    constructor() {
      this.count = 0;
      this.registry = new Map();
    }

    register(getQueryFunc) {
      const id = this.count++;
      this.registry.set(id, getQueryFunc);
      const self = this;
      return function() {
        self.registry.delete(id);
      }
    }

    buildQuery() {
      const fragments = [];
      for (var [key, getQueryFunc] of this.registry) {
        const fragment = getQueryFunc();
        if (fragment && fragment.length > 0) {
          fragments.push('(' + fragment + ')');
        }
      }
      if (fragments.length === 0) {
        fragments.push('*');
      }
      return fragments.join(' AND ');
    }
  }

  return new EzQueryRegistry();
});