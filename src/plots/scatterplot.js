import * as d3 from "d3";
import ScreenMapper from "../mappings/screen_mapping";
import CompositeMapper from "../mappings/composite_mapping";
import {ExtendedWilkinson} from "../algorithms/extended_wilkinsons";
import SegmentScreenMapper from "../mappings/segment_screen_mapping";
import PiecewiseLinearMapper from "../mappings/proportionate_split_mapping";
import LinearMapper from "../mappings/linear_mapping";
import {distortion, overplotting_2d, screen_histogram_2d} from "../benchmarks/benchmarks";

export default class ScatterPlot {

    constructor(chart_ref, data, selected_dimensions, raw_mappers, args) {
        // console.log(args)
        this.chart_spacing = args.gap_size
        this.tick_spacing_raw = args.tick_density
        this.use_density_cues = args.use_density_cues
        this.chart_ref = chart_ref
        this.data = data
        this.mappers = raw_mappers
        this.dimensions = selected_dimensions
        if (this.dimensions.length < 2)
            return
        this.x_dim = this.dimensions[0]
        this.y_dim = this.dimensions[1]
        this.color_dim = this.dimensions[2]
        this.x_mapper = null;
        this.y_mapper = null;
        this.point_size = 5
        this.init()
        // this.runBenchmarks()

    }

    init() {
        let plot = document.querySelector(this.chart_ref)
        // set the dimensions and margins of the graph
        const margin = {top: 10, right: 30, bottom: 40, left: 80}
        const height = plot.clientHeight - margin.top - margin.bottom;
        // const width = plot.clientWidth - margin.left - margin.right
        const width = height


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

        if (this.mappers[this.x_dim] instanceof PiecewiseLinearMapper) {
            this.x_mapper = new SegmentScreenMapper(this.mappers[this.x_dim], [0, width], this.chart_spacing)
        } else {
            let x_ranges_norm = this.mappers[this.x_dim].get_output_space_ranges()
            let x_screen_mapper = new ScreenMapper(x_ranges_norm, [0, width], this.chart_spacing)
            this.x_mapper = new CompositeMapper([this.mappers[this.x_dim], x_screen_mapper])
        }

        if (this.mappers[this.y_dim] instanceof PiecewiseLinearMapper) {
            this.y_mapper = new SegmentScreenMapper(this.mappers[this.y_dim], [height, 0], this.chart_spacing)
        } else {
            let y_ranges_norm = this.mappers[this.y_dim].get_output_space_ranges()
            let y_screen_mapper = new ScreenMapper(y_ranges_norm, [height, 0], this.chart_spacing)
            this.y_mapper = new CompositeMapper([this.mappers[this.y_dim], y_screen_mapper])
        }

        let color_mapper = this.mappers[this.color_dim]

        this.tick_spacing = this.tick_spacing_raw * Math.min(height, width)
        // console.log(this.tick_spacing_raw)
        // console.log(this.tick_spacing)
        // this.tick_spacing = (1 - parseInt(d3.select("#tick_density input").property("value")) / 100) ** 2 * Math.min(height, width) / 2
        this.x_data_range_length = x_ranges[x_ranges.length - 1][1] - x_ranges[0][0]
        this.y_data_range_length = y_ranges[y_ranges.length - 1][1] - y_ranges[0][0]
        for (let i = 0; i < x_ranges.length; i++) {
            const x_range = x_ranges[i]
            for (let j = 0; j < y_ranges.length; j++) {
                const y_range = y_ranges[j]
                this.make_tick_marks(base_svg, i, j, x_range, y_range, this.x_mapper, this.y_mapper)
                // console.log(x_range.toString() + "; " + y_range.toString())
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
            const x = tooltip_format.format(this.x_mapper.map_inverse(d.x_val))
            const y = tooltip_format.format(this.y_mapper.map_inverse(d.y_val))
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
                d.x_val = this.x_mapper.map(d[this.x_dim])
                d.y_val = this.y_mapper.map(d[this.y_dim])
                if (this.dimensions.length > 2)
                    d.color_val = color_mapper.map(d[this.color_dim])
                return d
            }))
            .enter()
            .append("circle")
            .attr("cx", d => d.x_val)
            .attr("cy", d => d.y_val)
            .attr("r", this.point_size)
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
        let density_cue_x = 0.5 + (x_range[1] - x_range[0]) / this.x_data_range_length;
        let density_cue_y = 0.5 + (y_range[1] - y_range[0]) / this.y_data_range_length;
        const no_x_ticks = Math.floor(tile_width * (this.use_density_cues ? density_cue_x : 1) / this.tick_spacing)
        const no_y_ticks = Math.floor(tile_height * (this.use_density_cues ? density_cue_y : 1) / this.tick_spacing)
        // console.log("make tick marks")
        // Wilkinson ticks
        let x_ticks_ew = ExtendedWilkinson(x_range, no_x_ticks).ticks
        let y_ticks_ew = ExtendedWilkinson(y_range, no_y_ticks).ticks
        if (x_ticks_ew === undefined) x_ticks_ew = []
        if (y_ticks_ew === undefined) y_ticks_ew = []
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

    runBenchmarks() {
        // console.log("BENCHMARKS")

        let dimensions = [this.dimensions[0], this.dimensions[1]]

        let data_per_dimension = {}
        dimensions.forEach((dim) => {
            let data = this.data.map((data_point) => data_point[dim])
            data_per_dimension[dim] = data
        })

        // console.log("OVERPLOTTING 2D")
        let dim_a = dimensions[0]
        let dim_b = dimensions[1]
        let data_a = data_per_dimension[dim_a]
        let data_b = data_per_dimension[dim_b]
        let linear_mapper_a = new LinearMapper(this.mappers[dim_a].get_output_space_ranges(), [0, 1])
        let comp_mapper_a = new CompositeMapper([this.mappers[dim_a], linear_mapper_a])
        let linear_mapper_b = new LinearMapper(this.mappers[dim_b].get_output_space_ranges(), [0, 1])
        let comp_mapper_b = new CompositeMapper([this.mappers[dim_b], linear_mapper_b])
        let histogram_2d = screen_histogram_2d(data_a, data_b, comp_mapper_a, comp_mapper_b, 100)
        let overplotting = overplotting_2d(histogram_2d)
        // console.log(`(${dim_a}, ${dim_b}): ${overplotting}`)

        // console.log("DISTORTION")
        dimensions.forEach((dim) => {
            let data = data_per_dimension[dim]
            let linear_mapper = new LinearMapper(this.mappers[dim].get_output_space_ranges(), [0, 1])
            let comp_mapper = new CompositeMapper([this.mappers[dim], linear_mapper])
            let distort = distortion(data, comp_mapper)
            // console.log(dim, ": ", distort)
        })

    }

    delete() {
        // d3.select("svg").remove()
        let plot = document.querySelector(this.chart_ref)
        plot.innerHTML = ""
    }
}

