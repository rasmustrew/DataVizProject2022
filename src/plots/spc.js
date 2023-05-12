import * as d3 from "d3";
import {logData} from "../usageDataCollector";
import {saveLogData} from "../usageDataCollector";
import ScreenMapper from "../mappings/screen_mapping";
import CompositeMapper from "../mappings/composite_mapping";
import { v4 as uuidv4 } from 'uuid';
import {
    distortion,
    line_crossings,
    overplotting_1d, overplotting_2d,
    pretty_print_benchmark,
    screen_histogram_1d,
    screen_histogram_2d
} from "../benchmarks/benchmarks";
import LinearMapper from "../mappings/linear_mapping";

let highlight_colour = "rgba(255, 0, 0, 0.4)"
let standard_colour = "rgba(70, 130, 180, 0.4)"

export default class SPC {
    constructor(container_ref, data, dimensions, raw_mappers) {
        this.container_ref
        this.data = data
        this.dimensions = dimensions
        this.brushes = {}
        for (let dimension of dimensions) {
            this.brushes[dimension] = []
            for (let i = 0; i < raw_mappers[dimension].get_output_space_ranges().length; i++) {
                this.brushes[dimension][i] = []
            }
        }


        let container = document.querySelector(container_ref)
        let plot = document.createElement("div")
        plot.classList.add("par_coords")
        plot.id = "plot_id_" + uuidv4()
        this.id = "#" + plot.id
        container.appendChild(plot)

        let buffer_size = 20;
        let margin = {top: 24, right: 80, bottom: 16, left: 80};
        this.margin = margin
        let width = plot.clientWidth - margin.left - margin.right;
        let height = plot.clientHeight - margin.top - margin.bottom;

        this.mappers = {}
        Object.entries(raw_mappers).forEach((entry) => {
            let dim = entry[0]
            let mapper = entry[1]
            let screen_mapper = new ScreenMapper(mapper.get_output_space_ranges(), [height, 0], buffer_size)
            this.mappers[dim] = new CompositeMapper([mapper, screen_mapper])
        })

        this.x = d3.scalePoint().domain(dimensions).range([0, width])
        this.foreground;
        this.background;
        this.runBenchmarks();

    }

    delete() {
        d3.select("svg").remove()
    }

    draw() {
        let _this = this
        let svg = d3.select(this.id).append("svg")
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
            .data(function (d) {
                return _this.mappers[d].get_input_space_ranges()
            })
            .enter().append("g")
            .attr("class", "axis")
            .each(function (_, index) {
                let dim = this.parentNode.__data__
                let screen_range = _this.mappers[dim].get_output_space_ranges()[index]
                // let screen_span = screen_range[0] - screen_range[1]
                // let num_ticks = Math.floor(screen_span / 100.0)
                let input_ranges = _this.mappers[dim].get_input_space_ranges()
                let tick_values = []
                if (index === 0) {
                    tick_values = input_ranges[index];
                } else if (index === input_ranges.length - 1) {
                    tick_values = [input_ranges[index][1]];
                } else {
                    tick_values = [input_ranges[index][1]];
                }
                let input_scale = _this.mappers[dim].get_input_space_ranges()[index]
                let output_scale = _this.mappers[dim].get_output_space_ranges()[index]
                let d3_scale = d3.scaleLinear().domain(input_scale).range(output_scale)

                d3.select(this).call(d3.axisLeft().scale(d3_scale).tickValues(tick_values).tickSize(15));
            })
        // Add and store a brush for each axis, allows the dragging selection on each axis.
        let brush_group = axes.append("g")
            .attr("class", "brush")
            .attr("cursor", "pointer")
            .attr("transform", `translate(${-8}, 0)`)

        let brush_overlays = brush_group.append('rect')
            .attr("width", 16)
            .attr("class", "brush_overlay")
            .attr('fill', "rgba(70, 130, 180, 0.2)")
            .attr('height', 10)

        brush_group.each((data, i, nodes) => {
            let _this = d3.select(nodes[i])
            let par_coords = this;
            let dimension = nodes[i].parentNode.parentNode.__data__;
            // let brush_field = _this.selectChild(".brush_field");
            // let brush_range = par_coords.y[dimension][i].range()
            let brush_range = par_coords.mappers[dimension].get_output_space_ranges()[i]
            let brush_start = Math.min(brush_range[0], brush_range[1])
            let brush_end = Math.max(brush_range[0], brush_range[1])
            console.log(dimension, i, brush_start)
            let brush_overlay = _this.selectChild(".brush_overlay")
                .attr("height", Math.floor(Math.abs(brush_range[0] - brush_range[1])))
                .attr("y", brush_start)
            brush_overlay.call(d3.drag()
                .on('start', (event, data) => {
                    console.log("drag start: ", event.y)
                    let new_index =  par_coords.brushes[dimension][i].length
                    let brush_field_group = _this.append("g")
                        .attr('data-i', new_index)
                        .attr("transform", `translate(0, ${event.y})`)
                        .attr("data-y", event.y)

                    let brush_field = brush_field_group.append("rect")
                        .attr("width", 16)
                        .attr("height", 0)
                        // .attr("y", event.y)
                        .attr("class", "brush_field")
                        .attr('fill', "rgba(255, 130, 180, 0.5)")

                    let brush_field_bottom = brush_field_group.append("rect")
                        .attr("width", 16)
                        .attr("height", 8)
                        .attr("class", "brush_field_edge")
                        .attr('fill', "rgba(255, 130, 180, 0.5)")
                        .attr('cursor', 'row-resize')
                        .call(d3.drag()
                            // .container(_this)
                            .on('drag', (event, data) => {
                                console.log("dragging bot")
                                console.log(event.y)
                                let old_y = parseInt(brush_field_bottom.attr("y"))
                                let old_height = parseInt(brush_field.attr("height"))
                                let new_height = old_height + event.dy
                                let new_bottom_y = old_y + event.dy

                                if (new_height < 16) {
                                    let diff = 16 - new_height
                                    new_height = 16
                                    new_bottom_y += diff
                                } else if (new_bottom_y > brush_end) {
                                    let diff = new_bottom_y - brush_end
                                    new_bottom_y = brush_end
                                    new_height -= diff
                                }
                                brush_field_bottom.attr("y", new_height - 8)
                                brush_field.attr("height", new_height)

                                let old_brush_selection = par_coords.brushes[dimension][i][new_index]
                                par_coords.brushes[dimension][i][new_index] = [old_brush_selection[0], new_bottom_y]
                                par_coords.brushed()
                            }))

                    let brush_field_top = brush_field_group.append("rect")
                        .attr("width", 16)
                        .attr("height", 8)
                        .attr("class", "brush_field_edge")
                        .attr('fill', "rgba(255, 130, 180, 0.5)")
                        .attr('cursor', 'row-resize')
                        .call(d3.drag()
                            .container(brush_field_group)
                            .on('drag', (event, data) => {
                                console.log("dragging top")
                                console.log(event.y)
                                let old_y = parseInt(brush_field_group.attr("data-y"))
                                let new_y = old_y + event.dy
                                let old_height = parseInt(brush_field.attr("height"))
                                let new_height = old_height - event.dy

                                if (new_y < brush_start) {
                                    let diff = brush_start - new_y
                                    new_y = brush_start
                                    new_height -= diff
                                } else if (new_height < 16) {
                                    let diff = 16 - new_height
                                    new_height = 16
                                    new_y -= diff
                                }

                                brush_field_group.attr("transform", `translate(0, ${new_y})`)
                                    .attr("data-y", new_y)
                                brush_field_bottom.attr("y", new_height - 8)

                                brush_field.attr("height", new_height)

                                par_coords.brushes[dimension][i][new_index] = [new_y, new_y + new_height]
                                par_coords.brushed()
                            }))



                    brush_field_group.call(d3.drag()
                        .on('drag', (event, data) => {
                            console.log("dragging whole")
                            console.log(event.y)
                            let old_y = parseInt(brush_field_group.attr("data-y"))
                            let new_y = old_y + event.dy
                            let height = parseInt(brush_field.attr("height"))
                            let bottom_y = new_y + height

                            if (new_y < brush_start) {
                                new_y = brush_start
                                bottom_y = new_y + height
                            } else if (bottom_y > brush_end) {
                                new_y = brush_end - height
                            }

                            brush_field_group.attr("transform", `translate(0, ${new_y})`)
                                .attr("data-y", new_y)

                            par_coords.brushes[dimension][i][new_index] = [new_y, bottom_y]
                            par_coords.brushed()
                        })
                    )

                    let cancel_icon = attachCancelIcon(brush_field_group)
                        .attr('visibility', "hidden")
                        .on('click', () => {
                            // console.log("deleting")
                            par_coords.brushes[dimension][i][new_index] = null
                            par_coords.brushed()
                            brush_field_group.remove()
                        })

                    brush_field_group.on('mouseover', (event) => {
                        // console.log("hover")
                        cancel_icon.attr('visibility', 'visible')
                    })
                    .on('mouseleave', (event) => {
                        // console.log("unhover")
                        cancel_icon.attr('visibility', 'hidden')
                    })

                    _this.brush_field_being_built = brush_field_group
                    _this.brush_field_being_built_bottom = brush_field_bottom

                    par_coords.brushes[dimension][i].push([event.y, event.y])
                    console.log(par_coords.brushes[dimension][i])

                })
                .on('drag', (event, data) => {
                    console.log("continuing drag", event.y)
                    let brush_min = Math.min(brush_range[0], brush_range[1])
                    let brush_max = Math.max(brush_range[0], brush_range[1])
                    let top_y = parseInt(_this.brush_field_being_built.attr("data-y"))
                    let height = event.y - top_y
                    let event_y = Math.max(event.y, brush_min)
                    console.log(event_y)
                    if (height + top_y > brush_max) {
                        height = brush_max - top_y
                    }
                    let field = _this.brush_field_being_built.select("rect")
                    if (height > 0) {
                        field.attr("height", height)
                    } else {
                        field.attr("height", Math.abs(height))
                        _this.brush_field_being_built.attr("data-y", event_y)
                        _this.brush_field_being_built.attr("transform", `translate(0, ${event_y})`)
                        _this.brush_field_being_built_bottom.attr("y", height)
                    }
                    _this.brush_field_being_built_bottom.attr("y", Math.abs(height) - 8)
                    let brush_index = parseInt(_this.brush_field_being_built.attr('data-i'))
                    let brush_y = parseInt(_this.brush_field_being_built.attr("data-y"))
                    let brush_height = parseInt(field.attr("height"))
                    let brush_bottom_y = brush_height + brush_y;
                    par_coords.brushes[dimension][i][brush_index] = [brush_y, brush_bottom_y]
                    // console.log(par_coords.brushes[dimension][i])
                    par_coords.brushed()
                })
            )
        })

        d3.select("#saveLogData").on("click", saveLogData)

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
        return this.mappers[dimension].map(domain_value)
    }

    highlight_ids(ids) {
        this.highlighted.style("stroke", function(data_point) {
            if (ids.length === 0) return standard_colour
            if (ids.includes(data_point.id)) {
                return highlight_colour
            }
            else {
                return standard_colour
            }
        });
    }

    axisHover(extent, dimension) {
        let selected = this.data.filter(data_point => {
            let data_float = data_point[dimension]
            return extent[0] <= data_float && data_float <= extent[1]
        })
        let selected_ids = selected.map(function (data_point) {
            return data_point.id
        })

        this.highlight_ids(selected_ids)
        if (this.other_plots) {
            for (let plot of this.other_plots) {
                plot.highlight_ids(selected_ids)
            }
        }
    }

    onClickAxis(extent, dim) {
        console.log(extent, dim)
        let current_index = this.selected_sub_axis[dim].indexOf(extent)
        if (current_index === -1) {
            this.selected_sub_axis[dim].push(extent)
        } else {
            this.selected_sub_axis[dim].splice(current_index, 1)
        }
        let selected_sub_axes = Object.entries(this.selected_sub_axis)


        let selected = this.data.filter(data_point => {
            return selected_sub_axes.every((tup) => {
                let dim = tup[0]
                let extents = tup[1]
                if (extents.length === 0) {
                    return true
                }
                return extents.some((extent) => {
                    let data_float = data_point[dim]
                    return extent[0] <= data_float && data_float <= extent[1]
                })
            })
        })

        var selected_ids = selected.map(function (data_point) {
            return data_point.id
        })
        this.updateParCoords(selected_ids)
        logData({
            timestamp: Date.now(),
            eventType : "brush",
            eventDetails: {
                "selected_sub_axes": selected_sub_axes,
                "selected_ids": selected_ids
            }
        });
    }

    // Handles a brush event, toggling the display of foreground lines.
    brushed() {
        // console.log("brushed!")
        let _this = this
        // active_dimensions is a list of dimensions currently being filtered upon
        let active_dimensions = this.dimensions.filter(function(dimension) {
            return _this.brushes[dimension].some((axis) => {
                let no_selection = axis.length === 0
                let only_null_selection = axis.every((selection) => selection === null)
                return !(no_selection || only_null_selection);
            })
        });

        let extents = {}
        active_dimensions.forEach(function(dimension) {
            let dimension_selections = _this.brushes[dimension].map((axis_selections, index) => {
                let axis_mapper = _this.mappers[dimension]
                let dataspace_selections = axis_selections.filter((selection) => selection !== null).map(function (screenspace_selection) {
                    let low = axis_mapper.map_inverse(screenspace_selection[0])
                    let high = axis_mapper.map_inverse(screenspace_selection[1])
                    return [low, high]
                })
                return dataspace_selections;
            })
            extents[dimension] = dimension_selections
        });

        // return the datapoints that are within the extents. It is only neccesary to be within one of the extents on an axis
        let selected = this.data.filter(data_point => {
            return active_dimensions.every((dimension, index) => {
                return extents[dimension].some((axis) => {
                    return axis.some((extent) => {
                        if (extent === null) {
                            return false
                        }
                        let data_float = data_point[dimension]
                        return extent[1] <= data_float && data_float <= extent[0]
                    })

                })
            })
        })
        let selected_ids = selected.map(function (data_point) {
            return data_point.id
        })
        this.updateParCoords(selected_ids)
        logData({
            timestamp: Date.now(),
            eventType : "brush",
            eventDetails: {
                extents: extents,
                selected_ids: selected_ids
            }
        });
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

        this.highlighted.style("display", function(data_point) {
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

    runBenchmarks() {
        console.log("BENCHMARKS")
        let data_per_dimension = {}
        this.dimensions.forEach((dim) => {
            let data = this.data.map((data_point) => data_point[dim])
            data_per_dimension[dim] = data
        })

        console.log("OVERPLOTTING 1D")
        this.dimensions.forEach((dim) => {
            let data = data_per_dimension[dim]
            let linear_mapper = new LinearMapper(this.mappers[dim].get_output_space_ranges(), [0, 1])
            let comp_mapper = new CompositeMapper([this.mappers[dim], linear_mapper])
            let histogram = screen_histogram_1d(data, comp_mapper, 100)
            // console.log(histogram)
            let overplotting = overplotting_1d(histogram)
            console.log(dim, ": ", overplotting)
        })

        console.log("OVERPLOTTING 2D")
        for (let i = 0; i < this.dimensions.length - 1; i++) {
            let dim_a = this.dimensions[i]
            let dim_b = this.dimensions[i+1]
            let data_a = data_per_dimension[dim_a]
            let data_b = data_per_dimension[dim_b]
            let linear_mapper_a = new LinearMapper(this.mappers[dim_a].get_output_space_ranges(), [0, 1])
            let comp_mapper_a = new CompositeMapper([this.mappers[dim_a], linear_mapper_a])
            let linear_mapper_b = new LinearMapper(this.mappers[dim_b].get_output_space_ranges(), [0, 1])
            let comp_mapper_b = new CompositeMapper([this.mappers[dim_b], linear_mapper_b])
            let histogram_2d = screen_histogram_2d(data_a, data_b, comp_mapper_a, comp_mapper_b, 100)
            let overplotting = overplotting_2d(histogram_2d)
            console.log(`(${dim_a}, ${dim_b}): ${overplotting}`)
        }
        console.log("LINE CROSSINGS AND AVG CROSSING ANGLE")
        for (let i = 0; i < this.dimensions.length - 1; i++) {
            let dim_a = this.dimensions[i]
            let dim_b = this.dimensions[i+1]
            let data_a = data_per_dimension[dim_a]
            let data_b = data_per_dimension[dim_b]
            let linear_mapper_a = new LinearMapper(this.mappers[dim_a].get_output_space_ranges(), [0, 1])
            let comp_mapper_a = new CompositeMapper([this.mappers[dim_a], linear_mapper_a])
            let linear_mapper_b = new LinearMapper(this.mappers[dim_b].get_output_space_ranges(), [0, 1])
            let comp_mapper_b = new CompositeMapper([this.mappers[dim_b], linear_mapper_b])

            let { avg_crossing_angle, number_of_line_crossings } = line_crossings(data_a, data_b, comp_mapper_a, comp_mapper_b, 1)
            console.log(`(${dim_a}, ${dim_b}): (${number_of_line_crossings}, ${avg_crossing_angle})`)
        }

        console.log("DISTORTION")
        this.dimensions.forEach((dim) => {
            let data = data_per_dimension[dim]
            let linear_mapper = new LinearMapper(this.mappers[dim].get_output_space_ranges(), [0, 1])
            let comp_mapper = new CompositeMapper([this.mappers[dim], linear_mapper])
            let distort = distortion(data, comp_mapper)
            console.log(dim, ": ", distort)
        })
    }
}

function attachCancelIcon(container) {
    let icon = container.append("g")
        .attr("width", 5)
        .attr("height", 5)
        .attr("transform", `translate(${20}, ${0})`)
    icon.append("circle")
        .attr("fill", "#f44336")
        .attr("r", 10)
    icon.append("line")
        .attr("stroke-width", 1)
        .attr("stroke", "#fff")
        .attr("x1", -5)
        .attr("y1", -5)
        .attr("x2", 5)
        .attr("y2", 5)
    icon.append("line")
        .attr("stroke-width", 1)
        .attr("stroke", "#fff")
        .attr("x1", 5)
        .attr("y1", -5)
        .attr("x2", -5)
        .attr("y2", 5)
    return icon
}


