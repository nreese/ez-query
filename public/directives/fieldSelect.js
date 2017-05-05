const _ = require('lodash');
const module = require('ui/modules').get('kibana');

define(function (require) {
  module.directive('fieldSelect', function (indexPatterns, Private) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        meta: '=',
        filterType: '='
      },
      template: require('./fieldSelect.html'),
      link: function (scope, element, attrs) {
        indexPatterns.getIds().then(ids => {
          scope.indexList = ids;
        });

        if (!scope.filterType) {
          scope.filterType = "Query";
        }

        scope.filterTypes = ["Query", "Geo Spatial"].map((value) => { return value });

        scope.fieldnames = [];
        scope.fetchFields = function() {
          indexPatterns.get(this.meta.indexId).then(indexPattern => {
            scope.fieldnames = indexPattern.fields.map(function (field) {
              return field.name;
            });
            scope.fieldnames = scope.fieldnames.sort((a, b) => {
              return a.localeCompare(b);
            });
          });
        }
        if (scope.meta.indexId) {
          scope.fetchFields();
        }
      }
    }
  });
});