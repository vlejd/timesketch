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
         * Heatmap chart for number of events per hour/weekday.
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
                    "nodes": [{"id":1,"value":"dean","type":"user_name"},
                              {"id":2,"value":"1234","type":"user_id"}],
                    "links":[{"source":1, "target":2, "type":"is",
                              "events":[{"id":10,"timestamp":20}]}]};

                scope.$watchGroup(['meta', 'showCharts'], function (newval, oldval) {
                    if(scope.showCharts) {
                        timesketchApi.aggregation(scope.sketchId, scope.query, scope.filter, 'heatmap')
                            .success(function(data) {
                                scope.render_lateralmap(tmp_data, element[0]);
                            });
                    }
                }, true);

                // Handle window resize, and redraw the chart automatically.
                $window.onresize = function() {
                    scope.$apply();
                };

                //TODO rescaling

                // Render the chart svg with D3.js
                scope.render_lateralmap = render_lateralmap;
                scope.render_lateralmap(tmp_data, element[0]);
            }
        }
    });

    function render_lateralmap(data, element){
        d3.select(element).select('svg').remove();
        var graph = data;
        graph.nodes.forEach(function(d){
            d.height = 20;
            d.width = Math.min(100, d.value.length*8 +2);
        });
        var font_size = 15,
            margin = { top: 50, right: 75, bottom: 0, left: 40 },
            width = element.parentElement.parentElement.parentElement.offsetParent.offsetWidth - margin.left - margin.right,
            height = 600; //TODO redo

        var svg = d3.select(element).append("svg").attr("width", width)
                                                  .attr("height", height);
        var holder = svg.append("g");

        svg.append('svg:defs').append('svg:marker')
            .attr('id', 'mid-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', -10)
            .attr('markerWidth', 3)
            .attr('markerHeight', 3)
            .attr('orient', 'auto')
          .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#000');

        svg.call(d3.zoom()
            .scaleExtent([1 / 5, 20])
            .on("zoom", zoomed));

        function zoomed() {
          holder.attr("transform", d3.event.transform);
          nodelabels.style("font-size", font_size/d3.event.transform.k);
          edgelabels.style("font-size", font_size/d3.event.transform.k);
          nodes.attr("width", function(d){return d.width/d3.event.transform.k});
          nodes.attr("height", function(d){return d.height/d3.event.transform.k});
        }

        function node_color(node){
          var maper = {
            "machine_name":d3.schemeCategory20[1],
            "ip":d3.schemeCategory20[3],
            "user_name":d3.schemeCategory20[5],
            "user_id":d3.schemeCategory20[7]
          }
          if(node.type in maper){
            return maper[node.type];
          }
          else{
            return d3.color("orange");
          }
        }
        function link_distance(link){
          var maper = {
            "has":10,
            "is":10,
            "access":500,
          }
          if(link.type in maper){
            return maper[link.type];
          }
          else{
            return 200;
          }
        }
        function link_strength(link){
          var maper = {
            "has":1000,
            "is":100,
            "access":0,
          }
          return 1;
          if(link.type in maper){
            return maper[link.type];
          }
          else{
            return 0.1;
          }
        }

        function link_color(link){
          var maper = {
            "is":d3.color("red"),
            "has":d3.color("blue"),
            "access":d3.color("green"),
          }
          if(link.type in maper){
            return maper[link.type];
          }
          else{
            return d3.color("orange");
          }
        }

        var simulation = d3.forceSimulation(graph.nodes).on("tick", ticked)
            .force("link", d3.forceLink(graph.links)
                             .id(function(d) { return d.id; })
                             .distance(function (d) {return link_distance(d);})
                             .strength(function (d) {return link_strength(d);})
                             )
            .force("charge", d3.forceManyBody()
                               .distanceMax(300)
                               .strength(-1000))
            .force("centering", d3.forceCenter(width / 2, height / 2))
            .force("circular", circular(width / 2, height / 2, 600));

        function circular(x, y, r) {
          var nodes,
              alpha;
          if (x == null) x = 0;
          if (y == null) y = 0;
          if (r == null) r = 200;

          function force(_) {
            var i, n = nodes.length, radius, dx, dy, ratio;
            for (alpha = _, i = 0; i < n; ++i) {

              dx = nodes[i].x - x;
              dy = nodes[i].y - y;
              radius = Math.sqrt(dx * dx + dy * dy)
              if(radius < 1) radius = 1;

              if(nodes[i].type == "machine_name" || nodes[i].type == "machine_ip"){
                ratio = (r-radius)/r;
                if(0< ratio && ratio <0.5) ratio = ratio*ratio;
                nodes[i].vx += ratio*dx;
                nodes[i].vy += ratio*dy;
              }

            }
          }

          force.initialize = function(_) {
            nodes = _;
          };

          return force;
        }

        var glinks = holder.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(graph.links)
            .enter().append("g")
            .attr("class","link");

        var links = glinks.append("line")
              .attr("stroke",link_color)
              .attr("stroke-opacity",0.5)
              .style('marker-start', function(d){
                return d.type=="access"? 'url(#mid-arrow)' : "" ;
              })
              .attr("stroke-width", function(d) { return 2; })
              .on("click",function(d){
                console.log(d.events.length);
                for (var e in d.events){
                  console.log(d.events[e]);

                }
              });


        var edgelabels = glinks.append('text')
                .text(function(d){return d.events.length;})
                .style("opacity", 0.5)
                .style("font-size", font_size)
                .attr('class', 'edgelabel');

        var gnodes = holder.append("g")
            .attr("class", "nodes")
            .selectAll(".node")
            .data(graph.nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(d3.drag()
                  .on("start", dragstarted)
                  .on("drag", dragged)
                  .on("end", dragended));

        var nodes = gnodes.append("rect")
            .attr("width", function(d){return d.width;}) //TODO getComputedTextLength()
            .attr("height", function(d){return d.height;})
            .style("opacity",0.5)
            .style("fill", node_color)
            .on("click",function(d){console.log(d);});

        var nodelabels = gnodes.append("text")
              .style("font-size", font_size)
              .text(function(d) {
                var text = d.value;

                if(text.length <= 15){
                  return text;
                }
                else{
                  return text.slice(0,13)+"...";
                }
              })
              .style("fill","black");

        function ticked() {
          var i = 0,
              n = graph.nodes.length;
          var q = d3.quadtree()
            .x(function(d){return d.x;})
            .y(function(d){return d.y;})
            .addAll(graph.nodes);
          while (++i < n) {
            q.visit(collide(graph.nodes[i]));
          }

          links
              .attr("x1", function(d) { return d.source.x; })
              .attr("y1", function(d) { return d.source.y; })
              .attr("x2", function(d) { return d.target.x; })
              .attr("y2", function(d) { return d.target.y; });
          nodes
            .attr("x", function (d) { return d.x;})
            .attr("y", function (d) { return d.y;});

          nodelabels
            .attr("x", function (d) {
              var rect_width = d3.select(this.parentNode).select("rect").attr("width");

              return d.x+rect_width*0.03;
            })
            .attr("y", function (d) {
              var rect_height = d3.select(this.parentNode).select("rect").attr("height");
              return d.y+rect_height*0.85;
            });

          edgelabels
              .attr("x",function(d) { return (d.source.x + d.target.x)/2; })
              .attr("y",function(d) { return (d.source.y + d.target.y)/2; });
        }

        function collide(node) {
          return function(tree, x1, y1, x2, y2) {
            var nx1 = node.x,
                ny1 = node.y,
                nx2 = node.x+node.width,
                ny2 = node.y+node.height;
            var left = Math.min(x1,nx1,x2,nx2),
                right =  Math.max(x1,nx1,x2,nx2),
                up =  Math.min(y1,ny1,y2,ny2),
                down =  Math.max(y1,ny1,y2,ny2);
            var xPadding = 5,
                yPadding = 5;
            var xSize = (x2-x1) + (nx2-nx1) + xPadding,
                ySize = (y2-y1) + (ny2-ny1) + yPadding;

            if( right - left < xSize && down-up < ySize ){ //TODO redo me
              if ("data" in tree && (tree.data !== node)) {
                var point = tree.data;
                var x = node.x - point.x,
                  y = node.y - point.y,
                  xSpacing = (point.width + node.width) / 2 + xPadding,
                  ySpacing = (point.height + node.height) / 2 + yPadding,
                  absX = Math.abs(x),
                  absY = Math.abs(y),
                  l,
                  lx,
                  ly;

                if (absX < xSpacing && absY < ySpacing) {
                  l = Math.sqrt(x * x + y * y);

                  lx = (absX - xSpacing) / l;
                  ly = (absY - ySpacing) / l;

                  // the one that's barely within the bounds probably triggered the collision
                  if (Math.abs(lx) > Math.abs(ly) ) {
                    lx = 0;
                  } else {
                    ly = 0;
                  }

                  node.x -= x *= lx;
                  node.y -= y *= ly;
                  point.x += x;
                  point.y += y;

                  return true;
                }
              }
              return false;
            }
            else{
              return true;
            }
          };
        }
        function dragstarted(d) {
          if (!d3.event.active) simulation.alphaTarget(0.1).restart();
          d.fx = d.x;
          d.fy = d.y;
        }

        function dragged(d) {
          d.fx = d3.event.x;
          d.fy = d3.event.y;
        }

        function dragended(d) {
          if (!d3.event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }
    }

})();
