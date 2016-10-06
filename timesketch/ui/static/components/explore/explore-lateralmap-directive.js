/*
 Copyright 2015 Google Inc. All rights reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

(function() {
    var module = angular.module('timesketch.explore.lateralmap.directive', []);

    module.directive('tsLateralmap', function ($window, timesketchApi) {
        /**
         * Handling lateral map.
         * @param sketchId - Sketch ID.
         * @param filter - Filter object.
         * @param query - Query string.
         * @param meta - Events metadata object.
         * @param showCharts - Boolean indicating if chars should be visible.
         */
        return {
            restrict: 'E',
            scope: {
                sketchId: '=',
                filter: '=',
                query: '=',
                meta: '=',
                showCharts: '='
            },
            require: '^tsSearch',
            link: function(scope, element, attrs, ctrl) {
                var tmp_data = {
                    "nodes": [{"id":0,"value":"dean","type":"user_name"},
                              {"id":1,"value":"1234","type":"user_id"}],
                    "links":[{"source":0, "target":1, "type":"is",
                              "events":[{"id":10,"timestamp":20}]}]};

                scope.$watchGroup(['meta', 'showCharts'], function (newval, oldval) {
                    if(scope.showCharts) {
                        if(!scope.rendered){
                          scope.rendered = true;
                        timesketchApi.eccemotus(scope.sketchId, scope.query, scope.filter, true)
                            .success(function(data) {
                                console.log(data);
                                scope.renderLateralMap(scope, data, element[0], ctrl);
                            });
                        }
                    }
                }, true);

                // Handle window resize, and redraw the chart automatically.
                $window.onresize = function() {
                    scope.$apply();
                };

                var margin = { top: 50, right: 75, bottom: 0, left: 40 },
                    svgWidth = element[0].parentElement.parentElement.parentElement.offsetParent.offsetWidth - margin.left - margin.right;

                scope.latheralMap = new LateralMap.Map(svgWidth, 900);
                // Render the chart svg with D3.js
                scope.renderLateralMap = renderLateralMap;
            }
        }
    });

    function renderLateralMap(scope, data, element, ctrl){
      scope.latheralMap.render(data, element);
      scope.latheralMap.customLinkClick(function(d){
        console.log(d);
      });
      scope.latheralMap.customNodeClick(function(d){
        ctrl.search(d.value, scope.filter);
      });
    }

})();
