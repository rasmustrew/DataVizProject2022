import * as d3 from "d3";

export default class ParallelCoordinates {
    constructor(data, dimensions, dimension_ranges) {
        let _this = this
        this.data = data;
        this.dimensions = dimensions
        this.dimension_ranges = dimension_ranges
        console.log(dimension_ranges)


        let margin = {top: 16, right: 48, bottom: 16, left: 48};
        let width = document.querySelector("#parCoordsDiv").clientWidth - margin.left - margin.right;
        let height = document.querySelector("#parCoordsDiv").clientHeight - margin.top - margin.bottom;
        this.screen_range = [0, height];

        this.x = d3.scalePoint().domain(dimensions).range([0, width])
        this.y = {}
        this.foreground;
        this.background;

        dimensions.forEach((d) => {
            let axes = []
            let distance_between = 10
            let current_offset = 0;
            for (let i = 0; i < dimension_ranges[d].length; i++) {
                console.log("offset", current_offset)
                let range = dimension_ranges[d][i]
                let range_count = data.filter(value => isValueInRange(value[d], range)).length;

                let range_proportion = range_count / data.length
                let proportionate_range = getProportionateRange(range_proportion, height, current_offset, dimension_ranges[d].length - 1, distance_between)
                current_offset = (height - proportionate_range[1]) + distance_between

                let axis = d3.scaleLinear()
                    .domain(dimension_ranges[d][i])
                    .range(proportionate_range);
                // axis.ticks(100)
                axes.push(axis)
            }
            _this.y[d] = axes
        })


        let svg = d3.select("#parCoordsDiv").append("svg")
            .attr("id", "parcoordsSvg")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .on('mouseleave', function(d) {
                d3.select("#hoverBox")
                    .style("visibility", "hidden")
            });

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

        // Add a group element for each dimension.
        let axis_groups = svg.selectAll(".dimension")
            .data(dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function(dimension_name) { return "translate(" + _this.x(dimension_name) + ")"; })

        // Add a title for each dimension.
        axis_groups.append("text")
            .style("text-anchor", "middle")
            .style("font-weight", 400)
            .style("overflow", "visible")
            .attr("y", -8)
            .text(function(dimension_name) {
                return dimension_name;
            });

        let axes = axis_groups.selectAll(".axis")
            .data(function(d) {
                return dimension_ranges[d]
            })
            .enter().append("g")
            .attr("class", "axis")
            .each(function(range, index) {
                let dim = this.parentNode.__data__
                let screen_range = _this.y[dim][index].range()
                let screen_span = screen_range[0] - screen_range[1]
                let num_ticks = Math.floor(screen_span / 100.0)
                let tick_values = [].concat(_this.y[dim][index].domain()[0], _this.y[dim][index].ticks(num_ticks), _this.y[dim][index].domain()[1]);
                d3.select(this).call(d3.axisLeft().scale(_this.y[dim][index]).tickValues(tick_values));
            })

        // Add and store a brush for each axis, allows the dragging selection on each axis.
        axes.append("g")
            .attr("class", "brush")
            .each(function(range, index) {
                let dim = this.parentNode.parentNode.__data__
                let screen_range = _this.y[dim][index].range()
                _this.y[dim][index].brush = d3.brushY()
                    .extent([[-8, screen_range[1]], [8, screen_range[0]]])
                    .on("brush", _this.brushed.bind(_this))
                d3.select(this).call(_this.y[dim][index].brush);
                _this.y[dim][index].svg = this;
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);





    }

    // Returns the path for a given data point.
    path(data_point) {
        let dimensions = this.dimensions;
        let _this = this
        let path = d3.path();
        let first_val = parseFloat(data_point[dimensions[0]])
        let y_pos = this.y_position(first_val, dimensions[0])

        path.moveTo(_this.x(dimensions[0]), y_pos)
        dimensions.slice(1).map(function(dimension) {
            let val = data_point[dimension];
            let y_pos = _this.y_position.bind(_this)(val, dimension)
            path.lineTo(_this.x(dimension), y_pos);
        });
        return path
    }

    y_position(domain_value, dimension) {
        let range_index = this.dimension_ranges[dimension].findIndex((range) => {
            return isValueInRange(domain_value, range)
        })
        return this.y[dimension][range_index](domain_value)
    }

    // Handles a brush event, toggling the display of foreground lines.
    brushed(event) {
        let _this = this
        console.log(event)
        console.log("calling brush")
        // active_dimensions is a list of dimensions currently being filtered upon
        var active_dimensions = this.dimensions.filter(function(dimension) {
            return _this.y[dimension].some((axis) => {
                return d3.brushSelection(axis.svg) != null
            })
        });

        // extents is the corresponding min and max of the filter on each axis
        let extents = {}
        active_dimensions.forEach(function(dimension) {
            let dimension_extents = _this.y[dimension].map((axis) => {
                let screenspace_selection = d3.brushSelection(axis.svg);
                console.log(screenspace_selection)
                let dataspace_selection = screenspace_selection.map(function (screenspace_position) {
                    return axis.invert(screenspace_position)
                })
                return dataspace_selection;
            })
            extents[dimension] = dimension_extents
        });

        // return the datapoints where all the filter parameters are within the extents
        var selected = this.data.filter(data_point => {
            return active_dimensions.every((dimension, index) => {
                return extents[dimension].some((extent) => {
                    let data_float = parseFloat(data_point[dimension])
                    return extent[1] <= data_float && data_float <= extent[0]
                })
            })
        })
        var selected_iso3 = selected.map(function (data_point) {
            return data_point.iso3
        })
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

function isValueInRange(value, range) {
    return (value >= range[0]) && (value <= range[1])
}

function getProportionateRange(proportion, max, offset, number_of_splits, distance_between) {
    let adjusted_max = max - distance_between * number_of_splits
    return [max - offset, (max - offset) - proportion * adjusted_max];
}







