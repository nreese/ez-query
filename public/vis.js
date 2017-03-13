import TemplateVisTypeTemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';

define(function (require) {
  require('ui/registry/vis_types').register(EzQueryVisProvider);
  require('plugins/ez-query/vis.less');
  require('plugins/ez-query/ezQueryRegistry');
  require('plugins/ez-query/directives/fieldSelect');
  require('plugins/ez-query/directives/linkedVis');
  require('plugins/ez-query/directives/luceneQueries');
  require('plugins/ez-query/visController');

  function EzQueryVisProvider(Private, getAppState, courier, config) {
    const TemplateVisType = Private(TemplateVisTypeTemplateVisTypeProvider);
    
    return new TemplateVisType({
      name: 'ez-query',
      title: 'EZ Query',
      icon: 'fa-ellipsis-v',
      description: 'Use this visualiation to provide a list of predefined Lucene queries for easy selection.',
      template: require('plugins/ez-query/vis.html'),
      params: {
        editor: require('plugins/ez-query/options.html'),
        defaults: {
          buttonType: 'radio',
          luceneQueries: [],
          field_meta: {},
          filters: [],
          filterType: 'query'
        }
      },
      requiresSearch: false
    });
  }

  return EzQueryVisProvider;
});
