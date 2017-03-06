import _ from 'lodash';
import $ from 'jquery';

define(function (require) {
  var module = require('ui/modules').get('kibana/ez-query', ['kibana']);
  
  module.controller('KbnEzQueryVisController', function ($scope, $timeout, getAppState, Private, ezQueryRegistry) {
    let $queryInput = null;
    let $querySubmit = null;
    const appState = getAppState();
    const DEFAULT_QUERY = '*';

    initLuceneQuery();
    const unregisterFunc = ezQueryRegistry.register(function() {
      return $scope.luceneQuery;
    });
    $scope.$on('$destroy', function() {
      if (unregisterFunc) unregisterFunc();
    });

    $scope.filter = function() {
      if ($scope.luceneQuery) {
        setQuery(ezQueryRegistry.buildQuery(), true);
      } else {
        setQuery(DEFAULT_QUERY, true);
      }
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

    function initLuceneQuery() {
      $scope.luceneQuery = '';
      $scope.vis.params.luceneQueries.forEach(query => {
        if (_.includes(appState.query.query_string.query, query.query)) {
          $scope.luceneQuery = query.query;
        }
      });
    }
  });
});
