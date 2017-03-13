# ez-query
Lucene Queries are a powerful tool that unleashes ElasticSearch. However, your average Kibana user will not understand the syntax and struggle crafting queries. EZ-query provides a simple kibana visualization that allows Dashboard authors to create a list of Lucene Queries that are then selectable from an easy to use GUI.

![alt text](https://github.com/nreese/ez-query/blob/gh-pages/images/multiple.gif)

## Dynamic Linked Time-Series
Experiment functionality that allows an ez-query visualization to dynamically update the linked timelion visualization's expression string to display a time series line for each selected lucene query.

Requires the following changes to KIBANA_HOME/src/core_plugins/timelion/public/vis/timelion_vis_controller.js
```
//expose scope
$element[0].isolateScope = function() {
  return $scope;
};

//expose function to unregister  expression watch to avoid duplicate run REST calls
$scope.unregisterVisParamsWatch = $scope.$watchMulti(['vis.params.expression', 'vis.params.interval'], $scope.search);

```

# Install
## Kibana 5.x
```bash
cd KIBANA_HOME/plugins
git clone git@github.com:nreese/ez-query.git
vi ez-query/package.js //set version to match kibana version
```

# Uninstall
## Kibana 5.x
```bash
./bin/kibana-plugin remove ez-query
```
