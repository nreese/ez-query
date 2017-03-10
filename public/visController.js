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
      let query = '';
      switch ($scope.vis.params.buttonType) {
        case 'radio':
          query = radioQuery();
          break;
        case 'checkbox':
          query = checkboxQuery();
          break;
      }
      return query;
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

    function radioQuery() {
      return $scope.radioVal;
    }

    function checkboxQuery() {
      let checkboxQueryString = '';
      const selected = [];
      _.forOwn($scope.checkboxes, (value, key) => {
        if (value) selected.push(key);
      });
      $scope.vis.params.luceneQueries.forEach(query => {
        if (_.includes(selected, query.name)) {
          if (checkboxQueryString.length > 0) {
            checkboxQueryString += ' OR ';
          }
          checkboxQueryString += '(' + query.query + ')';
        }
      });
      return checkboxQueryString;
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
