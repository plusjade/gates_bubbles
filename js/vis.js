var BubbleChart = (function() {

  function BubbleChart(data) {
    var sectionWidth = 100;
    var max_amount;
    this.data = data;
    this.width = 1000;
    this.height = 600;
    this.padding = 100;
    this.segmentWidth = 200;
    this.center = {
      x: this.width / 2,
      y: this.height / 2
    };
    this.layout_gravity = -0.01;
    this.damper = 0.1;
    this.vis = null;
    this.nodes = [];
    this.force = null;
    this.circles = null;
    var fill_color = d3.scale.ordinal().domain(["low", "medium", "high"]).range(["#6B238E", "#8A2BE2", "#BF5FFF"]);
    
    max_amount = d3.max(this.data, function(d) { return parseInt(d.total_amount) });
    this.radius_scale = d3.scale.pow().exponent(0.5).domain([0, max_amount]).range([2, 85]);

    var _this = this;

    // nodes
    this.data.forEach(function(d) {
      var node;
      node = {
        id: d.id,
        radius: 16,
        department: d.department,
        x: Math.random() * 900,
        y: Math.random() * 800
      };
      return _this.nodes.push(node);
    });
    this.nodes.sort(function(a, b) { return b.value - a.value; });

    this.force = d3.layout.force().nodes(this.nodes).size([this.width, this.height]);

    var that;
    that = this;

    this.vis = d3.select("#vis").append("svg")
      .attr("height", this.height)
      .attr("id", "svg_vis");

    // DATA
    this.circles = this.vis.selectAll("circle").data(this.nodes, function(d) { return d.id });

    // ENTER
    this.circles.enter()
      .append("circle")
      .attr("r", 0)
      .attr("fill", function(d) {
        return fill_color(d.group);
      })
      .attr("stroke-width", 2).attr("stroke", function(d) {
        return d3.rgb(fill_color(d.group)).darker();
      })
      .attr("id", function(d) {
        return "bubble_" + d.id;
      })

    // UPDATE
    this.circles
      .transition().duration(2000)
      .attr("r", function(d) { return d.radius });
  }


  BubbleChart.prototype.assemble = function() {
    var _this = this;

    this.vis.selectAll(".years").remove();

    _this.vis.transition().duration(500)
      .attr("width", this.width)

    this.force
      .gravity(this.layout_gravity)
      .charge(this.charge).friction(0.9)
      .on("tick", function(e) {
        _this.circles.each(function(d) {
             d.x = d.x + (_this.center.x - d.x) * (_this.damper + 0.02) * e.alpha;
             d.y = d.y + (_this.center.y - d.y) * (_this.damper + 0.02) * e.alpha;
          })
          .attr("cx", function(d) { return d.x })
          .attr("cy", function(d) { return d.y });
      })
      .start()
  };


  // Disperse into clusters grouped by <key>
  BubbleChart.prototype.disperse = function(key) {
    var _this = this;
    var keys = _.uniq(_.pluck(_this.data, key));
    var newWidth = keys.length*this.segmentWidth;
    var mid = this.segmentWidth/2;

    // evenly distribute the cluster points
    var cluster_points = {};
    keys.forEach(function(value, i) {
      cluster_points[value] = {
        x: (_this.segmentWidth*i + mid),
        y: _this.height/2
      };
    })

    console.log(_.pluck(cluster_points, 'x'))

    // UPDATE viewport
    _this.vis.transition().duration(500)
      .attr("width", newWidth)

    // UPDATE labels
    var nodes = _this.vis.selectAll(".years").data(keys);
    nodes.enter().append("text")
      .attr("class", "years")
      .attr("x", function(d) { return cluster_points[d].x })
      .attr("y", 40)
      .attr("text-anchor", "start")
      .text(function(d) { return d });

    // UPDATE nodes
    this.force
      .size([newWidth, this.height])
      .gravity(this.layout_gravity)
      .charge(this.charge)
      .friction(0.9)
      .on("tick", function(e) {
        _this.circles.each(function(d) {
            var point = cluster_points[d[key]];
            d.x = d.x + (point.x - d.x) * (_this.damper + 0.02) * e.alpha * 1.1;
            d.y = d.y + (point.y - d.y) * (_this.damper + 0.02) * e.alpha * 1.1;
          })
          .attr("cx", function(d) { return d.x })
          .attr("cy", function(d) { return d.y });
      })
      .start()
  };

  BubbleChart.prototype.charge = function(d) {
    return -Math.pow(d.radius, 2.0) / 8;
  };


  return BubbleChart;

})();
