import * as d3 from "d3";
import ScreenMapper from "../mappings/screen_mapping";
import CompositeMapper from "../mappings/composite_mapping";
import {ExtendedWilkinson} from "../algorithms/extended_wilkinsons";
import SegmentScreenMapper from "../mappings/segment_screen_mapping";
import ProportionateRangeMapper from "../mappings/proportionate_split_mapping";

export default class ScatterPlot {
    tick_spacing = 50
    chart_spacing = 25

    constructor(chart_ref, data, selected_dimensions, raw_mappers) {
        this.chart_ref = chart_ref
        this.data = data
        this.mappers = raw_mappers
        this.dimensions = selected_dimensions
        if (this.dimensions.length < 2)
            return
        this.x_dim = this.dimensions[0]
        this.y_dim = this.dimensions[1]
        this.color_dim = this.dimensions[2]
        this.init()
    }

    init() {
        let plot = document.querySelector(this.chart_ref)
        // set the dimensions and margins of the graph
        const margin = {top: 10, right: 30, bottom: 40, left: 80},
            width = plot.clientWidth - margin.left - margin.right,
            height = plot.clientHeight - margin.top - margin.bottom;

        // append the svg object to the body of the page
        const svg = d3.select(this.chart_ref)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        let base_svg = svg.append('g').attr("class", "chartSvg")

        // Add tick marks and lines
        let x_ranges = this.mappers[this.x_dim].get_input_space_ranges()
        let y_ranges = this.mappers[this.y_dim].get_input_space_ranges()

        let x_mapper = null
        if (this.mappers[this.x_dim] instanceof ProportionateRangeMapper) {
            x_mapper = new SegmentScreenMapper(this.mappers[this.x_dim], [0, width], this.chart_spacing)
        } else {
            let x_ranges_norm = this.mappers[this.x_dim].get_output_space_ranges()
            let x_screen_mapper = new ScreenMapper(x_ranges_norm, [0, width], this.chart_spacing)
            x_mapper = new CompositeMapper([this.mappers[this.x_dim], x_screen_mapper])
        }

        let y_mapper = null
        if (this.mappers[this.y_dim] instanceof ProportionateRangeMapper) {
            y_mapper = new SegmentScreenMapper(this.mappers[this.y_dim], [height, 0], this.chart_spacing)
        } else {
            let y_ranges_norm = this.mappers[this.y_dim].get_output_space_ranges()
            let y_screen_mapper = new ScreenMapper(y_ranges_norm, [height, 0], this.chart_spacing)
            y_mapper = new CompositeMapper([this.mappers[this.y_dim], y_screen_mapper])
        }

        let color_mapper = this.mappers[this.color_dim]

        this.tick_spacing = (1 - parseInt(d3.select("#tick_density_argument input").property("value")) / 100) ** 2 * Math.min(height, width) / 2

        for (let i = 0; i < x_ranges.length; i++) {
            const x_range = x_ranges[i]
            for (let j = 0; j < y_ranges.length; j++) {
                const y_range = y_ranges[j]
                this.make_tick_marks(base_svg, i, j, x_range, y_range, x_mapper, y_mapper)
                console.log(x_range.toString() + "; " + y_range.toString())
            }
        }

        // Tooltip
        const tooltip = d3.select(this.chart_ref).append("g").attr("class", "tooltip")
        let tooltip_format = Intl.NumberFormat("en-GB", { maximumSignificantDigits: 5 })

        // Mouse callbacks
        let mouseover = function(event,d) {
            tooltip.style("visibility", "visible")
        }

        let mousemove = (event, d) => {
            const x = tooltip_format.format(x_mapper.map_inverse(d.x_val))
            const y = tooltip_format.format(y_mapper.map_inverse(d.y_val))
            let color = ""
            if (this.dimensions.length > 2) {
                color = tooltip_format.format(color_mapper.map_inverse(d.color_val))
            }

            tooltip
                .html(d.id + "<br>"
                    + this.x_dim + ": " + x + "<br>"
                    + this.y_dim + ": " + y
                    + (this.dimensions.length > 2 ? "<br>" + this.color_dim + ": " + color : ""))
                .style("left", event.x + "px")
                .style("top", (event.y + 20) + "px")
        }
        let mouseleave = function(d) {
            tooltip.style("visibility", "hidden")
        }

        // Color scale
        let colorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain([0, 1])

        // Add dots
        base_svg.append('g')
            .selectAll("dot")
            .data(this.data.map(d => {
                d.x_val = x_mapper.map(d[this.x_dim])
                d.y_val = y_mapper.map(d[this.y_dim])
                if (this.dimensions.length > 2)
                    d.color_val = color_mapper.map(d[this.color_dim])
                return d
            }))
            .enter()
            .append("circle")
            .attr("cx", d => d.x_val)
            .attr("cy", d => d.y_val)
            .attr("r", 5)
            .style("fill", d => {
                if (this.dimensions.length < 3)
                    return 0
                return colorScale(d.color_val)
            })
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)

        // Add X axis label:
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width)
            .attr("y", height + margin.top + 20)
            .text(this.dimensions[0]);

        // Y axis label:
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left+30)
            .attr("x", -margin.top)
            .text(this.dimensions[1])
    }

    make_tick_marks(base_svg, i, j, x_range, y_range, x_mapper, y_mapper) {
        const x_range_screen = x_mapper.get_output_space_ranges()[i]
        const y_range_screen = y_mapper.get_output_space_ranges()[j]
        const tile_width = Math.abs(x_range_screen[0] - x_range_screen[1])
        const tile_height = Math.abs(y_range_screen[0] - y_range_screen[1])
        const no_x_ticks = Math.floor(tile_width / this.tick_spacing)
        const no_y_ticks = Math.floor(tile_height / this.tick_spacing)

        // Wilkinson ticks
        let x_ticks_ew = ExtendedWilkinson(x_range, no_x_ticks).ticks
        let y_ticks_ew = ExtendedWilkinson(y_range, no_y_ticks).ticks
        x_ticks_ew = x_ticks_ew.filter(tick => tick > x_range[0] && tick < x_range[1])
        y_ticks_ew = y_ticks_ew.filter(tick => tick > y_range[0] && tick < y_range[1])
        y_ticks_ew.reverse()

        let tick_format = Intl.NumberFormat("en-GB", { maximumSignificantDigits: 4 })

        let x = d3.scaleLinear()
            .domain(x_range)
            .range(x_range_screen)

        // Inner tick lines
        // Only place ticks if tile is large enough
        base_svg.append("g")
            .attr("transform", "translate(" + 0 + "," + y_range_screen[0] + ")")
            .attr("class", "tickline")
            .call(d3.axisBottom(x)
                .tickSize(-tile_height)
                .tickValues((tile_width >= this.tick_spacing) ? x_ticks_ew : [])
                .tickFormat((tick) => j === 0? tick_format.format(tick): "")
            )

        // Edge labels
        base_svg.append("g")
            .attr("transform", "translate(" + 0 + "," + (y_range_screen[0] + 10) + ")")
            .attr("class", "edgetick")
            .call(d3.axisBottom(x)
                .tickSize(-tile_height)
                .tickValues(x_range)
                .tickFormat((tick) => j === 0 ? tick_format.format(tick): "")
            )


        let y = d3.scaleLinear()
            .domain(y_range)
            .range(y_range_screen)

        // Inner tick lines
        base_svg.append("g")
            .attr("transform", "translate(" + x_range_screen[0] + "," + 0 + ")")
            .attr("class", "tickline")
            .call(d3.axisLeft(y)
                .tickSize(-tile_width)
                .tickValues((tile_height >= this.tick_spacing) ? y_ticks_ew : [])
                .tickFormat((tick) => i === 0 ? tick_format.format(tick) : "")
            )

        // Edge labels
        base_svg.append("g")
            .attr("transform", "translate(" + (x_range_screen[0] - 10) + "," + 0 + ")")
            .attr("class", "edgetick")
            .call(d3.axisLeft(y)
                .tickSize(-tile_width)
                .tickValues(y_range)
                .tickFormat((tick) => i === 0 ? tick_format.format(tick): "")
            )

        return base_svg;
    }
}

