import _ from 'lodash';
import $ from 'jquery';

define(function (require) {
  var module = require('ui/modules').get('kibana/ez-query', ['kibana']);
  
  module.controller('KbnEzQueryVisController', function ($scope, $timeout, getAppState, Private) {
    let $queryInput = null;
    let $querySubmit = null;
    const appState = getAppState();
    const DEFAULT_QUERY = '*';

    $scope.luceneQuery = appState.query.query_string.query;
    selectDefault();

    $scope.filter = function() {
      if ($scope.luceneQuery) {
        setQuery($scope.luceneQuery, true);
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

    function selectDefault() {
      if ($scope.luceneQuery === DEFAULT_QUERY) {
        $scope.luceneQuery = _.get($scope.vis.params, 'luceneQueries[0].query', DEFAULT_QUERY);
        setQuery($scope.luceneQuery, false);
      }
    }
  });
});
