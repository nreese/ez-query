const _ = require('lodash');
const module = require('ui/modules').get('kibana');

define(function (require) {
  module.directive('fieldSelect', function (indexPatterns, Private) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        meta: '='
      },
      template: require('./fieldSelect.html'),
      link: function (scope, element, attrs) {
        indexPatterns.getIds().then(ids => {
          scope.indexList = ids;
        });

        scope.fieldnames = [];
        scope.fetchFields = function() {
          indexPatterns.get(this.meta.indexId).then(indexPattern => {
            scope.fieldnames = indexPattern.fields.map(function (field) {
              return field.name;
            });
          });
        }
      }
    }
  });
});