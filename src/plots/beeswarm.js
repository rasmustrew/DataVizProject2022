import ScreenMapper from "../mappings/screen_mapping";
import CompositeMapper from "../mappings/composite_mapping";
import * as d3 from "d3";
import {averageHeight, distortion} from "../benchmarks/benchmarks";
import LinearMapper from "../mappings/linear_mapping";


export default class Beeswarm {

    constructor(chart_ref, data, dimension, raw_mapper) {
        let plot = document.querySelector(chart_ref)

        this.dimension = dimension
        let buffer_size = 50;
        let margin = {top: 80, right: 16, bottom: 80, left: 64};
        let width = plot.clientWidth - margin.left - margin.right;
        let height = plot.clientHeight - margin.top - margin.bottom;
        this.height = height
        let screen_mapper = new ScreenMapper(raw_mapper.get_output_space_ranges(), [0, width], buffer_size)
        let mapper = new CompositeMapper([raw_mapper, screen_mapper])
        this.mapper = mapper
        this.sorted_data = [...data]
        this.sorted_data.sort(function (a, b) {
            return a[dimension] - b[dimension];
        });

        // append the svg object to the body of the page
        const svg = d3.select(chart_ref).append("svg")
            .attr("class", "beeswarmSvg")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        for (let index = 0; index < mapper.get_input_space_ranges().length; index++) {
            console.log(index)
            let base_svg = svg.append('g').attr("class", "beeswarmSvg")
            this.create_single_beeswarm_plot(base_svg, data, mapper, index, dimension)
        }

        this.create_single_beeswarm_plot(svg, data, mapper, 0, dimension)

        this.runBenchmarks()
    }
    create_single_beeswarm_plot(svg, data, mapper, index, dimension) {
        const input_range = mapper.get_input_space_ranges()[index]
        const output_range = mapper.get_output_space_ranges()[index]
        const x = d3.scaleLinear()
            .range(output_range)
            .domain(input_range)
        // .padding(1);

        let axis_x = svg.append('g')
            .attr("class", "x_axis")
            .attr("transform", `translate(0, ${this.height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        this.radius = 8
        this.circle_padding = 4
        this.circle_centers = []


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
        console.log("BENCHMARKS")
        console.log("AVERAGE HEIGHT")
        let height_sum = this.circle_centers.reduce((acc, val) => acc + (this.height - val.y), 0)
        let average_height = height_sum / this.circle_centers.length
        console.log(this.dimension, average_height)

        console.log("DISTORTION")
        let linear_mapper = new LinearMapper(this.mapper.get_output_space_ranges(), [0, 1])
        let comp_mapper = new CompositeMapper([this.mapper, linear_mapper])
        let data = this.sorted_data.map((val) => val[this.dimension])
        let distort = distortion(data, comp_mapper)
        console.log(this.dimension, ": ", distort)
    }
}

