import _ from 'lodash';
import $ from 'jquery';

define(function (require) {
  return function LinkedVisFactory(indexPatterns, Private, savedVisualizations) {

    function findLinkedVis(visTitle) {
      let $timelionEl = null;
      $(".panel, .panel-default").each(function(index) {
        if ($(this).find('.panel-title').text().trim() === visTitle) {
          $timelionEl = $(this).find(".timelion-vis");
        }
      });
      return $timelionEl;
    }

    class LinkedVis {
      constructor(visId, indexId) {
        this.visId = visId;
        this.indexId = indexId;
        this.linkedScope = null;
        this.timefield = null;

        indexPatterns.get(this.indexId).then(indexPattern => {
          this.timefield = indexPattern.timeFieldName
        });

        savedVisualizations.get(this.visId).then(savedVis => {
          this.visTitle = savedVis.title;
        });
      }

      update(selectedQueries) {
        if (!this.linkedScope) {
          $visEl = findLinkedVis(this.visTitle);
          if ($visEl && _.isFunction($visEl[0].isolateScope)) {
            const visScope = $visEl[0].isolateScope();
            visScope.unregisterVisParamsWatch();
            this.linkedScope = visScope;
          } else {
            console.warn('Could not find linked panel in dashboard or linked panel does not expose scope');
          }
        }

        if (this.linkedScope && this.timefield) {
          let expressions = [];
          selectedQueries.forEach(query => {
            expressions.push(
              `.es(q='${query.query}', index='${this.indexId}', timefield='${this.timefield}').label('${query.name}')`);
          });
          if (expressions.length === 0) {
            expressions.push(
              `.es(q='*', index='${this.indexId}', timefield='${this.timefield}').label('all')`);
          }
          this.linkedScope.vis.params.interval = 'auto';
          this.linkedScope.vis.params.expression = expressions.join(', ');
        }
      }
    }

    return LinkedVis;
  }; 
});