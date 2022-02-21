import * as d3 from "d3";

export default class ParallelCoordinates {
    constructor(data, dimensions, dimension_ranges) {
        let _this = this
        this.data = data;
        this.dimensions = dimensions
        console.log(dimension_ranges)


        let margin = {top: 16, right: 48, bottom: 16, left: 48};
        let width = document.querySelector("#parCoordsDiv").clientWidth - margin.left - margin.right;
        let height = document.querySelector("#parCoordsDiv").clientHeight - margin.top - margin.bottom;
        this.screen_range = [0, height];

        this.x = d3.scalePoint().domain(dimensions).range([0, width])
        this.y = {}
        this.foreground;
        this.background;

        dimensions.forEach(function(d) {
            _this.y[d] = d3.scaleLinear()
                .domain(dimension_ranges[d])
                .range([height, 0]);
        })

        let svg = d3.select("#parCoordsDiv").append("svg")
            .attr("id", "parcoordsSvg")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .on('mouseleave', function(d) {
                d3.select("#hoverBox")
                    .style("visibility", "hidden")
            });

        // // Add a group element for each dimension.
        let axis_groups = svg.selectAll(".dimension")
            .data(dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function(dimension_name) { return "translate(" + _this.x(dimension_name) + ")"; })

        // Add an axis and title for each dimension.
        let axes = axis_groups.append("g")
            .attr("class", "axis")
            .each(function(d) {d3.select(this).call(d3.axisLeft(_this.y[d])); })
            .append("text")
            .style("text-anchor", "middle")
            .style("font-weight", 400)
            .style("overflow", "visible")
            .attr("y", -8)
            .text(function(dimension_name) {
                return dimension_name;
            });

        // Add and store a brush for each axis, allows the dragging selection on each axis.
        axis_groups.append("g")
            .attr("class", "brush")
            .each(function(d) {
                let range = _this.y[d].range();
                _this.y[d].brush = d3.brushY()
                    .extent([[-8, range[1]], [8, range[0]]])
                    .on("brush", _this.brushed.bind(_this))
                d3.select(this).call(_this.y[d].brush);
                _this.y[d].svg = this;
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);


        //Add grey background lines for context.
        this.background = svg.append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(data)
            .enter().append("path")
            .attr("d", this.path.bind(this));

        // Add coloured foreground lines for focus.
        this.foreground = svg.append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(data)
            .enter().append("path")
            // .attr("stroke", "d00")
            // .attr("stroke", row => color_continents(row["continent"]))
            .attr("d", this.path.bind(this))
            // make the cursor a pointer when hovering the lines
            .attr("pointer-events", "visiblePainted")
            .attr("cursor", "pointer")
            .attr("stroke-width", "2px")
            //handle hover and click events
            .on('mouseover', this.onHoverLine.bind(this));
    }

    // Returns the path for a given data point.
    path(data_point) {
        let dimensions = this.dimensions;
        let x = this.x;
        let y = this.y;
        let path = d3.path();
        let first_val = data_point[dimensions[0]]
        path.moveTo(x(dimensions[0]), y[dimensions[0]](first_val))
        dimensions.slice(1).map(function(dimension) {
            let val = data_point[dimension];
            path.lineTo(x(dimension), y[dimension](val));
        });
        return path
    }

    // Handles a brush event, toggling the display of foreground lines.
    brushed(event) {
        let _this = this
        console.log(event)
        console.log("calling brush")
        // active_dimensions is a list of dimensions currently being filtered upon
        var active_dimensions = this.dimensions.filter(function(dimension) {
            return d3.brushSelection(_this.y[dimension].svg) != null;
        });
        console.log(active_dimensions)
        // extents is the corresponding min and max of the filter on each dimensions
        var extents = active_dimensions.map(function(dimension) {
            let screenspace_selection = d3.brushSelection(_this.y[dimension].svg);
            console.log(screenspace_selection)
            let dataspace_selection = screenspace_selection.map(function (screenspace_position) {
                return _this.y[dimension].invert(screenspace_position)
            })
            return dataspace_selection;
        });
        console.log(extents)

        // return the datapoints where all the filter parameters are within the extents
        var selected = this.data.filter(data_point =>
            active_dimensions.every(
                (dimension, index) =>
                    extents[index][1] <= data_point[dimension] && data_point[dimension] <= extents[index][0]
            )
        )
        console.log(selected)
        var selected_iso3 = selected.map(function (data_point) {
            return data_point.iso3
        })

        console.log(selected_iso3)

        this.updateParCoords(selected_iso3)
    }

    updateParCoords(selected_iso3) {
        // If the svg has not finished rendering for the first time yet, just return.
        if (!this.foreground) {
            return
        }
        this.foreground.style("display", function(data_point) {
            if (selected_iso3.length === 0) return 'none'
            if (selected_iso3.includes(data_point.iso3)) {
                return null
            }
            else {
                return 'none'
            }
        });

    }

    onHoverLine(mouse_event, data) {
        d3.select("#hoverBox")
            .style("visibility", "visible")
            .style("top", mouse_event.clientY + 'px')
            .style("left", mouse_event.clientX + 8 + 'px')
            .text(data.name)
    }
}







