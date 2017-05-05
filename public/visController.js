import _ from 'lodash';
import $ from 'jquery';

define(function (require) {
  var module = require('ui/modules').get('kibana/ez-query', ['kibana']);
  
  module.controller('KbnEzQueryVisController', function ($scope, $timeout, getAppState, Private, ezQueryRegistry, savedVisualizations, esAdmin) {
    const queryFilter = Private(require('ui/filter_bar/query_filter'));
    let $queryInput = null;
    let $querySubmit = null;
    const appState = getAppState();
    const DEFAULT_QUERY = '*';

    init();

    // Get the visualization document in the index since we'll want to change the visState.
    let title = $scope.vis.title;
    esAdmin.search({
      index: '.kibana',
      type: 'visualization',
      body: {
        query: {
          bool: {
            must: { match_phrase: { title } },
          }
        },
        size: 1
      }
    }).then((response) => {
      if (response.hits.hits[0]) {
        $scope.visualizationId = response.hits.hits[0]._id;
      }
    });

    const unregisterFunc = ezQueryRegistry.register(function() {
      const selected = getSelectedQueries();
      if (selected.length === $scope.queries.length) {
        $scope.toggle.isChecked = true;
      } else {
        $scope.toggle.isChecked = false;
      }
      const queryString = _.map(selected, query => {
        return '(' + query.query + ')';
      }).join(' OR ');
      return queryString;
    });
    $scope.$on('$destroy', function() {
      if (unregisterFunc) unregisterFunc();
    });
    queryFilter.on('update', function() {
      if ($scope.vis.params.filterType === 'filter' && !findFilter()) {
        clearSelectedQueries();
      }
    });

    $scope.toggle = {
      isChecked: false
    };
    $scope.toggleAll = function() {
      $scope.queries.forEach(query => {
        $scope.checkboxes[query.name] = $scope.toggle.isChecked;
      });
      $scope.filter();
    }
    $scope.filter = _.debounce(function() {
      switch ($scope.vis.params.filterType) {
        case 'filter':
          const selected = getSelectedQueries();
          if (selected.length === 0) {
            const existingFilter = findFilter();
            if (existingFilter) {
              queryFilter.removeFilter(existingFilter);
            }
          } else {
            setFilter(selected);
          }
          break;
        default:
          setQuery(ezQueryRegistry.buildQuery(), true);
      }
    }, _.get($scope.vis.params, 'selectionDebounce', 350), false);

    function isGeoSpatialFilterType() {
      return $scope.vis.params.field_meta.filterType === 'Geo Spatial';
    }

    function setFilter(selected) {
      const alias = selected.map(function(query) {
        return query.name;
      }).join(',');

      let query_string = "";
      let geoSpatialModel = null;
      if (!isGeoSpatialFilterType()) {
        query_string = {
          fields: [$scope.vis.params.field_meta.key],
          query: selected.map(function (query) {
            return query.query;
          }).join(' OR ')
        };
      }
      else {
        let geoFilters = [];
        if (selected.length > 1) {
          geoSpatialType = 'bool';
          selected.forEach((query) => {
            geoFilters.push(getGeoSpatialModel(query.filter));
          });

          geoSpatialModel = {
            bool: {
              should: geoFilters
            }
          };
        }
        else {
          geoSpatialModel = getGeoSpatialModel(selected[0].filter);
        }
      }

      let existingFilter = findFilter();
      if (existingFilter) {
        let updateFilter = null;
        if (isGeoSpatialFilterType()) {
          // Have to get existing type and pass it to updateFilter as type so it can delete
          // the source property after the merge.
          let existingType = '';
          if (_.has(existingFilter, 'bool.should')) {
            existingType = 'bool';
          } else if (_.has(existingFilter, 'geo_bounding_box')) {
            existingType = 'geo_bounding_box';
          } else if (_.has(existingFilter, 'geo_polygon')) {
            existingType = 'geo_polygon';
          } else if (_.has(existingFilter, 'geo_shape')) {
            existingType = 'geo_shape';
          }

          updateFilter = {
            model: geoSpatialModel,
            source: existingFilter,
            type: existingType,
            alias: alias
          }
        }
        else {
          updateFilter = {
            model: {
              query_string: query_string
            },
            source: existingFilter,
            alias: alias
          };
        }

        queryFilter.updateFilter(updateFilter);
      } else {
        let newFilter = null;
        if (isGeoSpatialFilterType()) {
          newFilter = geoSpatialModel;
        }
        else {
          newFilter = {
            query_string: query_string,
          }
        }

        newFilter.meta = {
          alias: alias,
          negate: false,
          index: $scope.vis.params.field_meta.indexId,
          key: $scope.vis.params.field_meta.key
        }
        queryFilter.addFilters(newFilter);
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

    function isGeoFilter(filter, field) {
      if (filter.meta.key === field
        || _.has(filter, ['geo_bounding_box', field])
        || _.has(filter, ['geo_distance', field])
        || _.has(filter, ['geo_polygon', field])
        || _.has(filter, ['geo_shape', field])) {
          return true;
        } else if(_.has(filter, ['bool', 'should'])) {
          let model = getGeoSpatialModel(filter);
          let found = false;
          for (let i = 0; i < model.bool.should.length; i++) {
            if (_.has(model.bool.should[i], ['geo_bounding_box', field])
              || _.has(model.bool.should[i], ['geo_distance', field])
              || _.has(model.bool.should[i], ['geo_polygon', field])
              || _.has(model.bool.should[i], ['geo_shape', field])) {
              found = true;
              break;
            }
          }
          return found;
        } else {
          return false;
        }
    }

    function findFilter() {
      let existingFilter = null;
      _.flatten([queryFilter.getAppFilters(), queryFilter.getGlobalFilters()]).forEach(function (it) {
        if (isGeoSpatialFilterType()) {
          if (isGeoFilter(it, $scope.vis.params.field_meta.key)) {
            existingFilter = it;
          }
        } else {
          if (_.has(it, 'query_string.fields') &&
            _.includes(_.get(it, 'query_string.fields', []), $scope.vis.params.field_meta.key)) {
            existingFilter = it;
          }
        }
      });
      return existingFilter;
    }

    function getSelectedQueries() {
      const selected = [];
      switch ($scope.vis.params.buttonType) {
        case 'radio':
          $scope.queries.forEach(query => {
            if (query.name === $scope.radioVal) {
              selected.push(query);
            }
          });
          break;
        case 'checkbox':
          const checked = [];
          _.forOwn($scope.checkboxes, (isChecked, queryName) => {
            if (isChecked) checked.push(queryName);
          });
          $scope.queries.forEach(query => {
            if (_.includes(checked, query.name)) {
              selected.push(query);
            }
          });
          break;
      }
      return selected;
    }

    function clearSelectedQueries() {
      switch ($scope.vis.params.buttonType) {
        case 'radio':
          $scope.radioVal = null;
          break;
        case 'checkbox':
          _.forOwn($scope.checkboxes, (value, key, object) => {
            object[key] = false;
          });
          break;
      }
    }

    $scope.$watch('vis.params', function (visParams) {
      switch ($scope.vis.params.filterType) {
        case 'filter':
          $scope.queries = $scope.vis.params.filters;
          break;
        default:
          $scope.queries = $scope.vis.params.luceneQueries;
      }
    });

    $scope.$listen(queryFilter, 'update', function () {
      getAvailableFilters();
    });

    $scope.addFilter = function() {
      const filter = $scope.availableFilters.find((filter) => filter.$$hashKey === $scope.filterToAdd);
      let name = $scope.newName ? $scope.newName : filter.meta.alias;
      filter.meta.alias = name;
      filter.meta.key = $scope.vis.params.field_meta.key;
      const newFilter = {name: name, filter: filter};
      $scope.vis.params.filters.push(newFilter);
      $scope.queries = $scope.vis.params.filters;
      $scope.vis.setState($scope.vis);
      savedVisualizations.get($scope.visualizationId).then((visualization) => {
        visualization.visState.params.filters = $scope.vis.params.filters;
        visualization.save();
        setFilter([newFilter]);
        getAvailableFilters();
        $scope.radioVal = name;
        $scope.checkboxes[name] = true;
      });
    }

    function getAvailableFilters() {
      $scope.filterToAdd = null;
      $scope.availableFilters = [];
      $scope.newName = null;
      if (!isGeoSpatialFilterType()) {
        return;
      }
      _.flatten(queryFilter.getFilters()).forEach(function (filter) {
        if (isGeoFilter(filter, $scope.vis.params.field_meta.key)) {
          let existingFilter = $scope.vis.params.filters.find((namedFilter) => {
            return containsGeoFilter(filter, namedFilter.filter);
          });
          if (!existingFilter) {
            $scope.availableFilters.push(filter);
            // If we have available filters then any previously selected filter is technically no
            // longer selected because it's filter has been changed to something we dont know.
            clearSelectedQueries();
          }
        }
      });
    }

    $scope.clearSelect = function() {
      clearSelectedQueries();
      let existingFilter = findFilter();
      queryFilter.removeFilter(existingFilter);
    }

    function getGeoSpatialModel(filter) {
      let geoSpatialModel = null;
      if (_.has(filter, 'bool.should')) {
        geoSpatialModel = { bool: filter.bool };
      } else if (_.has(filter, 'geo_bounding_box')) {
        geoSpatialModel = { geo_bounding_box: filter.geo_bounding_box };
      } else if (_.has(filter, 'geo_polygon')) {
        geoSpatialModel = { geo_polygon: filter.geo_polygon };
      } else if (_.has(filter, 'geo_shape')) {
        geoSpatialModel = { geo_shape: filter.geo_shape };
      }

      return geoSpatialModel;
    }

    function containsGeoFilter(left, right) {
      const names = left.meta.alias.split(',');
      return names.indexOf(right.meta.alias) > -1;
    }

    function init() {
      $scope.radioVal = '';
      $scope.checkboxes = {};

      if (!$scope.vis.params.field_meta.filterType) {
        $scope.vis.params.field_meta.filterType = 'Query';
      }
      switch ($scope.vis.params.filterType) {
        case 'filter':
          $scope.queries = $scope.vis.params.filters;
          let existingFilter = findFilter();
          if (existingFilter) {
            $scope.vis.params.filters.forEach(query => {
              if (isGeoSpatialFilterType()) {
                if (containsGeoFilter(existingFilter, query.filter)) {
                  $scope.radioVal = query.name;
                  $scope.checkboxes[query.name] = true;
                }
              } else {
                if (_.includes(existingFilter.query_string.query, query.query)) {
                  $scope.radioVal = query.query;
                  $scope.checkboxes[query.name] = true;
                }
              }
            });
          }
          getAvailableFilters();
          break;
        default:
          $scope.queries = $scope.vis.params.luceneQueries;
          $scope.vis.params.luceneQueries.forEach(query => {
            if (_.includes(appState.query.query_string.query, query.query)) {
              $scope.radioVal = query.query;
              $scope.checkboxes[query.name] = true;
            }
          });
      }
    }
  });
});
