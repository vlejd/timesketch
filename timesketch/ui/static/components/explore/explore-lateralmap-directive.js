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
                // Handle window resize, and redraw the chart automatically.
                $window.onresize = function() {
                    scope.$apply();
                };
                var buttonQuery = $('<button class="btn btn-default"><i class="fa fa-save"></i>Based on query</button>');
                var buttonFull = $('<button class="btn btn-default"><i class="fa fa-save"></i>Full</button>');
                var msg = $('<p id="lateral-message"><p>');
                $(element[0]).append(buttonQuery);
                $(element[0]).append(buttonFull);
                $(element[0]).append(msg);

                buttonQuery.click(function(){
                    timesketchApi.eccemotus(scope.sketchId, scope.query, scope.filter, false)
                        .success(function(data) {
                            scope.handleLateralMap(scope, data, element[0], ctrl);
                        });
                });
                buttonFull.click(function(){
                    timesketchApi.eccemotus(scope.sketchId, scope.query, scope.filter, true)
                        .success(function(data) {
                            scope.handleLateralMap(scope, data, element[0], ctrl);
                        });
                });

                var margin = { top: 50, right: 75, bottom: 0, left: 40 },
                    svgWidth = element[0].parentElement.parentElement.parentElement.offsetParent.offsetWidth - margin.left - margin.right;

                scope.latheralMap = new LateralMap.Map(svgWidth, 900);
                // Render the chart svg with D3.js
                scope.renderLateralMap = renderLateralMap;
                scope.handleLateralMap = handleLateralMap;
            }
        }
    });

    function handleLateralMap(scope, data, element, ctrl){
        $(element).find('svg').remove();
        msg = $('#lateral-message');
        if('nodes' in data){
            msg.text('');
            if(data.nodes.length==0){
                msg.text('Graph is empty. Change your query please.');
            }
            else{
                scope.renderLateralMap(scope, data, element, ctrl);
            }
        }
        else{
            msg.text('Computing, retrieve graph (click) later please.');
        }
    };

    function renderLateralMap(scope, data, element, ctrl){
        scope.latheralMap.render(data, element, true);
        scope.latheralMap.customLinkClick(function(d){
            console.log(d);
        });
        scope.latheralMap.customNodeClick(function(d){
            ctrl.search(d.value, scope.filter);
        });
    }

})();
