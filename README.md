# ez-query
Lucene Queries are a powerful tool that unleashes ElasticSearch. However, your average Kibana user will not understand the syntax and struggle crafting queries. EZ-query provides a simple kibana visualization that allows Dashboard authors to create a list of Lucene Queries that are then selectable from an easy to use GUI.

![alt text](https://github.com/nreese/ez-query/blob/gh-pages/images/multiple.gif)

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
