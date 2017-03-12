import _ from 'lodash';
import $ from 'jquery';

define(function (require) {
  var module = require('ui/modules').get('kibana/ez-query', ['kibana']);
  
  module.controller('KbnEzQueryVisController', function ($scope, $timeout, getAppState, Private, ezQueryRegistry) {
    let $queryInput = null;
    let $querySubmit = null;
    const appState = getAppState();
    const DEFAULT_QUERY = '*';

    init();
    const unregisterFunc = ezQueryRegistry.register(function() {
      const selected = getSelectedLuceneQueries();
      const queryString = _.map(selected, query => {
        return '(' + query.query + ')';
      }).join(' OR ');
      return queryString;
    });
    $scope.$on('$destroy', function() {
      if (unregisterFunc) unregisterFunc();
    });

    $scope.filter = function() {
      setQuery(ezQueryRegistry.buildQuery(), true);
    }

    function setQuery(queryString, submit) {
      if (!$queryInput) {
        $queryInput = $("input[aria-label='Filter input']");
      }
      if (!$querySubmit) {
        $querySubmit = $("button[aria-label='Filter Dashboards']");
      }

      if ($queryInput && $querySubmit) {
        appState.query.query_string.query = queryString;
        //appState.save();
        $queryInput.val(queryString);
        if (submit) {
          $timeout(function() {
            $querySubmit.trigger('click');
          }, 0);
        }
      }
    }

    function getSelectedLuceneQueries() {
      const selected = [];
      switch ($scope.vis.params.buttonType) {
        case 'radio':
          $scope.vis.params.luceneQueries.forEach(query => {
            if (query.query === $scope.radioVal) {
              selected.push(query);
            }
          });
          break;
        case 'checkbox':
          const checked = [];
          _.forOwn($scope.checkboxes, (isChecked, queryName) => {
            if (isChecked) checked.push(queryName);
          });
          $scope.vis.params.luceneQueries.forEach(query => {
            if (_.includes(checked, query.name)) {
              selected.push(query);
            }
          });
          break;
      }
      return selected;
    }

    function init() {
      $scope.radioVal = '';
      $scope.checkboxes = {};
      $scope.vis.params.luceneQueries.forEach(query => {
        if (_.includes(appState.query.query_string.query, query.query)) {
          $scope.radioVal = query.query;
          $scope.checkboxes[query.name] = true;
        }
      });
    }
  });
});
