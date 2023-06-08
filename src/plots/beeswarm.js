import ScreenMapper from "../mappings/screen_mapping";
import CompositeMapper from "../mappings/composite_mapping";
import * as d3 from "d3";
import {averageHeight, distortion} from "../benchmarks/benchmarks";
import LinearMapper from "../mappings/linear_mapping";
import PiecewiseLinearMapper from "../mappings/proportionate_split_mapping";
import SegmentScreenMapper from "../mappings/segment_screen_mapping";
import {ExtendedWilkinson} from "../algorithms/extended_wilkinsons";


export default class Beeswarm {

    constructor(chart_ref, data, dimension, raw_mapper, circle_radius, args) {

        let plot = document.querySelector(chart_ref)

        this.dimension = dimension
        this.radius = circle_radius
        let margin = {top: 80, right: 64, bottom: 80, left: 64};
        let width = plot.clientWidth - margin.left - margin.right;
        let height = plot.clientHeight - margin.top - margin.bottom;
        this.height = height

        this.gap_size = args.gap_size
        this.tick_spacing = args.tick_density * width
        this.use_density_cues = args.use_density_cues

        let mapper
        if (raw_mapper instanceof PiecewiseLinearMapper) {
            mapper = new SegmentScreenMapper(raw_mapper, [0, width], this.gap_size)
        } else {
            let output_ranges = raw_mapper.get_output_space_ranges()
            let screen_mapper = new ScreenMapper(output_ranges, [0, width], this.gap_size)
            mapper = new CompositeMapper([raw_mapper, screen_mapper])
        }
        this.mapper = mapper
        this.sorted_data = [...data]
        this.sorted_data.sort(function (a, b) {
            return a[dimension] - b[dimension];
        });
        let input_ranges = mapper.get_input_space_ranges()
        this.data_range_length = input_ranges[input_ranges.length - 1][1] - input_ranges[0][0]



        // append the svg object to the body of the page
        const svg = d3.select(chart_ref).append("svg")
            .attr("class", "beeswarmSvg")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        for (let index = 0; index < mapper.get_input_space_ranges().length; index++) {
            // console.log(index)
            let base_svg = svg.append('g').attr("class", "beeswarmSvg")
            this.create_single_beeswarm_plot(base_svg, data, mapper, index, dimension)
        }

        this.create_single_beeswarm_plot(svg, data, mapper, 0, dimension)

    }

    create_single_beeswarm_plot(svg, data, mapper, index, dimension) {
        const input_range = mapper.get_input_space_ranges()[index]
        const output_range = mapper.get_output_space_ranges()[index]
        const tile_width = output_range[1] - output_range[0]
        const x = d3.scaleLinear()
            .range(output_range)
            .domain(input_range)
        // .padding(1);

        // Wilkinson ticks
        let density_cue_x = 0.5 + (input_range[1] - input_range[0]) / this.data_range_length;
        const no_x_ticks = Math.floor(tile_width * (this.use_density_cues ? density_cue_x : 1) / this.tick_spacing)
        let ticks = ExtendedWilkinson(input_range, no_x_ticks).ticks

        if (ticks === undefined) ticks = []
        ticks = ticks.filter(tick => tick > input_range[0] && tick < input_range[1])
        ticks.push(input_range[0])
        ticks.push(input_range[1])
        let tick_format = Intl.NumberFormat("en-GB", { maximumSignificantDigits: 4 })

        let axis_x = svg.append('g')
            .attr("class", "x_axis")
            .attr("transform", `translate(0, ${this.height})`)
            .call(d3.axisBottom(x)
                .tickValues((tile_width >= this.tick_spacing) ? ticks : [])
                .tickFormat((tick) => tick_format.format(tick))
            )
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        this.circle_padding = 4
        this.circle_centers = []

        // Create walls
        let wall_spacing = Math.floor(this.radius * 1.5)

        svg.append("line")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .attr("x1", output_range[0] - wall_spacing)
            .attr("x2", output_range[1] + wall_spacing)
            .attr("y1", this.height)
            .attr("y2", this.height)

        svg.append("line")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .attr("x1", output_range[0] - wall_spacing)
            .attr("x2", output_range[0] - wall_spacing)
            .attr("y1", 0)
            .attr("y2", this.height)

        svg.append("line")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .attr("x1", output_range[1] + wall_spacing)
            .attr("x2", output_range[1] + wall_spacing)
            .attr("y1", 0)
            .attr("y2", this.height)

        //Create dots
        svg.selectAll("circle")
            .data(this.sorted_data)
            .join("circle")
            .attr("cx", function(d) { return mapper.map(d[dimension]); })
            .attr("cy", (d) => { return this.y_position(d[dimension], mapper.map(d[dimension])) })
            .attr("r", this.radius)
            .style("fill", "#69b3a2")
            .attr("stroke", "black")
    }

    delete() {
        d3.select("svg").remove()
    }

    y_position(data_point, x_pos) {
        let y_pos = this.height - (this.radius + this.circle_padding)
        // console.log("before: ", x_pos, y_pos)

        let found_collision = true
        while (found_collision) {
            found_collision = false
            for (let circle of this.circle_centers) {
                while (this.collision(circle, {x: x_pos, y: y_pos})) {
                    y_pos -=1
                    // console.log("collision with: ", circle)
                    found_collision = true
                }
            }
        }

        // console.log("after: ", x_pos, y_pos)

        this.circle_centers.push({
            x: x_pos,
            y: y_pos
        })

        return y_pos

    }
    collision(a, b) {
        let distance_x = a.x - b.x
        let distance_y = a.y - b.y
        let distance = Math.sqrt(Math.pow(distance_x, 2) + Math.pow(distance_y, 2))
        return distance <= this.radius * 2 + this.circle_padding
    }

    runBenchmarks() {
        // console.log("BENCHMARKS")
        // console.log("AVERAGE HEIGHT")
        let height_sum = this.circle_centers.reduce((acc, val) => acc + (this.height - val.y), 0)
        let average_height = height_sum / this.circle_centers.length
        // console.log(this.dimension, average_height)

        // console.log("DISTORTION")
        let linear_mapper = new LinearMapper(this.mapper.get_output_space_ranges(), [0, 1])
        let comp_mapper = new CompositeMapper([this.mapper, linear_mapper])
        let data = this.sorted_data.map((val) => val[this.dimension])
        let distort = distortion(data, comp_mapper)
        // console.log(this.dimension, ": ", distort)

        return average_height
    }
}

