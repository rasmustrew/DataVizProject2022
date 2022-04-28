import * as d3 from "d3";

export default class APC {
    constructor(data, dimensions, dimension_ranges, element_id) {
        this.data = data;
        this.dimensions = dimensions
        this.dimension_ranges = dimension_ranges

        this.element_id = element_id

        let margin = {top: 24, right: 48, bottom: 16, left: 48};
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


        let pixel_median = height / 2
        let quartile_pixel_q1 = pixel_median + height / 6
        let quartile_pixel_q3 = pixel_median - height / 6


        let quartiles = this.compute_quartiles()
        this.quartiles = quartiles
        console.log(quartiles)


        for (let dim of this.dimensions) {
            let q3_pixel_diff = pixel_median - quartile_pixel_q3
            let q3_domain_diff = quartiles[dim].q3 - quartiles[dim].median
            let q3_transform = q3_pixel_diff / q3_domain_diff
            let q3_domain_max = pixel_median/q3_transform + quartiles[dim].median
            quartiles[dim].domain_max = q3_domain_max

            let q1_pixel_diff = quartile_pixel_q1 - pixel_median
            let q1_domain_diff = quartiles[dim].median - quartiles[dim].q1
            let q1_transform = q1_pixel_diff / q1_domain_diff
            let q1_domain_min = quartiles[dim].median - pixel_median/q1_transform
            quartiles[dim].domain_min = q1_domain_min
            this.y[dim] = {
                "min-q1": d3.scaleLinear()
                    .domain([quartiles[dim].min, quartiles[dim].q1])
                    .range([height, quartile_pixel_q1]),
                "q1-median": d3.scaleLinear()
                    .domain([quartiles[dim].q1, quartiles[dim].median])
                    .range([quartile_pixel_q1, pixel_median]),
                "median-q3": d3.scaleLinear()
                    .domain([quartiles[dim].median, quartiles[dim].q3])
                    .range([pixel_median, quartile_pixel_q3]),
                "q3-max": d3.scaleLinear()
                    .domain([quartiles[dim].q3, quartiles[dim].max])
                    .range([quartile_pixel_q3, 0]),

            }
        }
    }

    compute_quartiles() {
        let quartiles = {}
        for (let dimension of this.dimensions) {
            let dim_data = this.data.map((data_point) => data_point[dimension])
            dim_data.sort(function (a, b) {
                return a - b;
            });
            let median = dim_data[Math.round(dim_data.length/2)]
            let q1 = dim_data[Math.round(dim_data.length/4)]
            let q3 = dim_data[Math.round(dim_data.length * (3/4))]
            let min = dim_data[0]
            let max = dim_data[dim_data.length - 1]
            quartiles[dimension] = {
                min,
                q1,
                median,
                q3,
                max
            }
        }
        return quartiles
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

        this.highlighted = svg.append("g")
            .attr("class", "highlighted")
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
            .data(["min-q1", "q1-median", "median-q3", "q3-max"])
            .enter().append("g")
            .attr("class", "axis")
            .each(function (axis, index) {
                let dim = this.parentNode.__data__
                let tick_values = []
                if (axis === 'min-q1') {
                    tick_values = [_this.quartiles[dim].min];
                } else if (axis === 'q1-median') {
                    tick_values = [_this.quartiles[dim].q1];
                } else if (axis === 'median-q3') {
                    tick_values = [_this.quartiles[dim].median];
                } else {
                    tick_values = [_this.quartiles[dim].q3, _this.quartiles[dim].max];
                }

                d3.select(this).call(d3.axisLeft().scale(_this.y[dim][axis]).tickValues(tick_values));
            })

        // Add and store a brush for each axis, allows the dragging selection on each axis.
        axes.append("g")
            .attr("class", "brush")
            .each(function (axis, index) {
                let dim = this.parentNode.parentNode.__data__
                let screen_range = _this.y[dim][axis].range()
                _this.y[dim][axis].brush = d3.brushY()
                    .extent([[-8, screen_range[1]], [8, screen_range[0]]])
                    .on("brush", _this.brushed.bind(_this))
                    .on("end",  _this.brushed.bind(_this))
                d3.select(this).call(_this.y[dim][axis].brush);
                _this.y[dim][axis].svg = this;
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

    highlight_ids(ids) {
        this.highlighted.style("display", function(data_point) {
            if (ids.length === 0) return null
            if (ids.includes(data_point.id)) {
                return 'unset'
            }
            else {
                return null
            }
        });
    }

    y_position(domain_value, dimension) {
        let axis;
        if (domain_value <= this.quartiles[dimension].q1) {
            axis = "min-q1"
        } else if (domain_value <= this.quartiles[dimension].median){
            axis = "q1-median"
        } else if (domain_value <= this.quartiles[dimension].q3){
            axis = "median-q3"
        } else {
            axis = "q3-max"
        }

        return this.y[dimension][axis](domain_value)
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







