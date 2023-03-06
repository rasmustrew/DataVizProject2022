import * as d3 from "d3";
import ScreenMapper from "../mappings/screen_mapping";
import CompositeMapper from "../mappings/composite_mapping";

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
        let x_ranges_norm = this.mappers[this.x_dim].get_output_space_ranges()
        let y_ranges_norm = this.mappers[this.y_dim].get_output_space_ranges()
        let x_screen_mapper = new ScreenMapper(x_ranges_norm, [0, width], this.chart_spacing)
        let y_screen_mapper = new ScreenMapper(y_ranges_norm, [height, 0], this.chart_spacing)
        let x_mapper = new CompositeMapper([this.mappers[this.x_dim], x_screen_mapper])
        let y_mapper = new CompositeMapper([this.mappers[this.y_dim], y_screen_mapper])
        let color_mapper = this.mappers[this.color_dim]

        for (var i = 0; i < x_ranges.length; i++) {
            const x_range = x_ranges[i]
            for (var j = 0; j < y_ranges.length; j++) {
                const y_range = y_ranges[j]
                this.add_chart_tile(svg, i, j, x_range, y_range, x_mapper, y_mapper)
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

    add_chart_tile(base_svg, i, j, x_range, y_range, x_mapper, y_mapper) {
        const x_range_screen = x_range.map(v => x_mapper.map(v))
        const y_range_screen = y_range.map(v => y_mapper.map(v))
        const tile_width = Math.abs(x_range_screen[0] - x_range_screen[1])
        const tile_height = Math.abs(y_range_screen[0] - y_range_screen[1])
        const no_x_ticks = Math.floor(tile_width / this.tick_spacing)
        const no_y_ticks = Math.floor(tile_height / this.tick_spacing)
        const x_ticks = []
        for (let k = 0; k <= no_x_ticks; k++) {
            x_ticks.push(x_range_screen[0] + k / no_x_ticks * tile_width)
        }
        const y_ticks = []
        for (let k = 0; k <= no_y_ticks; k++) {
            y_ticks.push(y_range_screen[1] + k / no_y_ticks * tile_height)
        }

        let tick_format = Intl.NumberFormat("en-GB", { maximumSignificantDigits: 3 })

        //base_svg = base_svg.append("g").attr("style", "outline: thin solid red;")

        var x = d3.scaleLinear()
            .domain(x_range_screen)
            .range([x_range_screen[0] + this.chart_spacing * i, x_range_screen[1] + this.chart_spacing * i])

        base_svg.append("g")
            .attr("transform", "translate(" + 0 + "," + (y_range_screen[0] - this.chart_spacing * j) + ")")
            .call(d3.axisBottom(x)
                .tickSize(-tile_height)
                .tickValues(x_ticks)
                .tickFormat(tick_val => j === 0
                    ? tick_format.format(x_mapper.map_inverse(tick_val))
                    : "")
            ).select(".domain").remove()

        var y = d3.scaleLinear()
            .domain(y_range_screen)
            .range([y_range_screen[0] - this.chart_spacing * j, y_range_screen[1] - this.chart_spacing * j])

        base_svg.append("g")
            .attr("transform", "translate(" + (x_range_screen[0] + this.chart_spacing * i) + ","+ 0 + ")")
            .call(d3.axisLeft(y)
                .tickSize(-tile_width)
                .tickValues(y_ticks)
                .tickFormat(tick_val => i === 0
                    ? tick_format.format(y_mapper.map_inverse(tick_val))
                    : "")
            ).select(".domain").remove()
        return base_svg;
    }
}

