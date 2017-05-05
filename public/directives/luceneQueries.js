const _ = require('lodash');
const module = require('ui/modules').get('kibana');

define(function (require) {
  module.directive('queryList', function (Private) {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        queries: '=',
        title: '=',
        addQuery: '='
      },
      template: require('./luceneQueries.html'),
      link: function (scope, element, attrs) {
        scope.add = function() {
          scope.queries.push({});
        }
        scope.remove = function(index) {
          scope.queries.splice(index, 1);
        }
      }
    }
  });
});