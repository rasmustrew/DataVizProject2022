import * as d3 from "d3";

export const ScaleType = {
    Linear: "Linear",
    Log: "Log"

}

export default class ParallelCoordinates {
    constructor(data, dimensions, dimension_ranges, element_id, scale_type) {
        this.data = data;
        this.dimensions = dimensions
        this.dimension_ranges = dimension_ranges

        this.element_id = element_id
        this.scale_type = scale_type

        let margin = {top: 16, right: 48, bottom: 16, left: 48};
        this.margin = margin
        let width = document.querySelector(element_id).clientWidth - margin.left - margin.right;
        let height = document.querySelector(element_id).clientHeight - margin.top - margin.bottom;
        this.screen_range = [0, height];
        this.height = height
        this.width = width;

        this.x = d3.scalePoint().domain(dimensions).range([0, width])
        this.y = {}
        this.foreground;
        this.background;

        this.set_dimension_ranges(dimension_ranges);
    }

    set_dimension_ranges(dimension_ranges) {
        let _this = this
        _this.dimensions.forEach((d) => {
            _this.update_single_dimension_ranges(d, dimension_ranges[d])
        })
    }

    update_single_dimension_ranges(dimension, ranges) {
        this.dimension_ranges[dimension] = ranges
        let axes = []
        let distance_between = 10
        let current_offset = 0;
        for (let i = 0; i < ranges.length; i++) {
            let range = ranges[i]
            let range_count = this.data.filter(value => isValueInRange(value[dimension], range)).length;

            let range_proportion = range_count / this.data.length
            let proportionate_range = getProportionateRange(range_proportion, this.height, current_offset, ranges.length - 1, distance_between)
            current_offset = (this.height - proportionate_range[1]) + distance_between

            if (this.scale_type === ScaleType.Linear) {
                let axis = d3.scaleLinear()
                    .domain(ranges[i])
                    .range(proportionate_range);
                axes.push(axis)
            } else if (this.scale_type === ScaleType.Log) {
                let axis = d3.scaleLog()
                    .domain(ranges[i])
                    .range(proportionate_range);
                axes.push(axis)
            }
        }
        this.y[dimension] = axes
    }

    delete() {
        d3.select("svg").remove()
    }

    draw() {
        let _this = this
        let svg = d3.select(this.element_id).append("svg")
            .attr("class", "parcoordsSvg")
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
            .on('mouseleave', function (d) {
                d3.select("#hoverBox")
                    .style("visibility", "hidden")
            });

        //Add grey background lines for context.
        this.background = svg.append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(this.data)
            .enter().append("path")
            .attr("d", this.path.bind(this));

        // Add coloured foreground lines for focus.
        this.foreground = svg.append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(this.data)
            .enter().append("path")
            .attr("d", this.path.bind(this))
            // make the cursor a pointer when hovering the lines
            .attr("pointer-events", "visiblePainted")
            .attr("cursor", "pointer")
            .attr("stroke-width", "2px")
            //handle hover and click events
            .on('mouseover', this.onHoverLine.bind(this));

        // Add a group element for each dimension.
        let axis_groups = svg.selectAll(".dimension")
            .data(this.dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function (dimension_name) {
                return "translate(" + _this.x(dimension_name) + ")";
            })

        // Add a title for each dimension.
        axis_groups.append("text")
            .style("text-anchor", "middle")
            .style("font-weight", 400)
            .style("overflow", "visible")
            .attr("y", -8)
            .text(function (dimension_name) {
                return dimension_name;
            });

        let axes = axis_groups.selectAll(".axis")
            .data(function (d) {
                return _this.dimension_ranges[d]
            })
            .enter().append("g")
            .attr("class", "axis")
            .each(function (range, index) {
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
            .each(function (range, index) {
                let dim = this.parentNode.parentNode.__data__
                let screen_range = _this.y[dim][index].range()
                _this.y[dim][index].brush = d3.brushY()
                    .extent([[-8, screen_range[1]], [8, screen_range[0]]])
                    .on("brush", _this.brushed.bind(_this))
                    .on("end",  _this.brushed.bind(_this))
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
        let first_val = data_point[dimensions[0]]
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
        // active_dimensions is a list of dimensions currently being filtered upon
        var active_dimensions = this.dimensions.filter(function(dimension) {
            return _this.y[dimension].some((axis) => {
                return d3.brushSelection(axis.svg) != null
            })
        });

        // extents is a double map of the min and max on each axis
        let extents = {}
        active_dimensions.forEach(function(dimension) {
            let dimension_extents = _this.y[dimension].map((axis) => {
                let screenspace_selection = d3.brushSelection(axis.svg);
                if (screenspace_selection === null) {
                    return null
                }
                let dataspace_selection = screenspace_selection.map(function (screenspace_position) {
                    return axis.invert(screenspace_position)
                })
                return dataspace_selection;
            })
            extents[dimension] = dimension_extents
        });

        // return the datapoints that are within the extents. It is only neccesary to be within one of the extents on an axis
        var selected = this.data.filter(data_point => {
            return active_dimensions.every((dimension, index) => {
                return extents[dimension].some((extent) => {
                    if (extent === null) {
                        return false
                    }
                    let data_float = data_point[dimension]
                    return extent[1] <= data_float && data_float <= extent[0]
                })
            })
        })
        var selected_ids = selected.map(function (data_point) {
            return data_point.id
        })
        this.updateParCoords(selected_ids)
    }

    updateParCoords(selected_ids) {
        // If the svg has not finished rendering for the first time yet, just return.
        if (!this.foreground) {
            return
        }
        this.foreground.style("display", function(data_point) {
            if (selected_ids.length === 0) return 'none'
            if (selected_ids.includes(data_point.id)) {
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
            .text(data.id)
    }
}

function isValueInRange(value, range) {
    return (value >= range[0]) && (value <= range[1])
}

function getProportionateRange(proportion, max, offset, number_of_splits, distance_between) {
    let adjusted_max = max - distance_between * number_of_splits
    return [max - offset, (max - offset) - proportion * adjusted_max];
}







