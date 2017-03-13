const _ = require('lodash');
const module = require('ui/modules').get('kibana');

define(function (require) {
  module.directive('linkedVis', function (indexPatterns, Private) {
    const service = Private(require('ui/saved_objects/saved_object_registry')).byLoaderPropertiesName.visualizations;

    return {
      restrict: 'E',
      replace: true,
      scope: {
        linkedVis: '='
      },
      template: require('./linkedVis.html'),
      link: function(scope, element, attrs) {
        if (!scope.linkedVis) {
          scope.linkedVis = {}
        }
        
        indexPatterns.getIds().then(ids => {
          scope.indexList = ids;
        });
        fetchVisList();

        scope.filterVisList = function() {
          scope.linkedVis.visFilter = this.linkedVis.visFilter;
          fetchVisList();
        }

        function fetchVisList() {
          service.find(scope.linkedVis.visFilter)
          .then(hits => {
            scope.visList = _.chain(hits.hits)
            .filter(hit => {
              const visState = JSON.parse(hit.visState);
              return _.includes(['timelion'], visState.type);
            })
            .map(hit => {
              return {
                label: hit.title,
                id: hit.id
              }
            })
            .value();
          });
        }
      }
    }
  });
});