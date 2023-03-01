import {v4 as uuidv4} from "uuid";
import * as d3 from "d3";
import ScreenMapper from "../mappings/screen_mapping";
import CompositeMapper from "../mappings/composite_mapping";
export default class Lollipop {
    constructor(container_ref, data, dimension, raw_mapper) {
        let container = document.querySelector(container_ref)
        let plot = document.createElement("div")
        plot.classList.add("lollipop")
        plot.id = "plot_id_" + uuidv4()
        this.id = "#" + plot.id
        container.appendChild(plot)

        let buffer_size = 20;
        let margin = {top: 24, right: 48, bottom: 16, left: 48};
        let width = plot.clientWidth - margin.left - margin.right;
        let height = plot.clientHeight - margin.top - margin.bottom;
        let screen_mapper = new ScreenMapper(raw_mapper.get_output_space_ranges(), [height, 0], buffer_size)
        let mapper = new CompositeMapper([raw_mapper, screen_mapper])

        // append the svg object to the body of the page
        const svg = d3.select(this.id).append("svg").attr("class", "lollipopSvg")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);


        // X axis
        const x = d3.scaleBand()
            .range([ 0, width ])
            .domain(data.map(function(d) { return d.id; }))
            .padding(1);
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        // Add Y axes
        let axis_group = svg.append("g")
            .attr("class", "dimension")
            .attr("transform", "translate(0)")

        axis_group.append("text")
            .style("text-anchor", "middle")
            .style("font-weight", 400)
            .style("overflow", "visible")
            .attr("y", -8)
            .text(dimension);

        let axes = axis_group.selectAll(".axis")
            .data(function (d) {
                return mapper.get_input_space_ranges()
            })
            .enter().append("g")
            .attr("class", "axis")
            .each(function (range, index) {
                let screen_range = mapper.get_output_space_ranges()[index]
                let input_ranges = mapper.get_input_space_ranges()
                let tick_values = []
                if (index === 0) {
                    tick_values = range;
                } else if (index === input_ranges.length - 1) {
                    tick_values = [range[1]];
                } else {
                    tick_values = [range[1]];
                }
                let input_scale = range
                let output_scale = screen_range
                let d3_scale = d3.scaleLinear().domain(input_scale).range(output_scale)
                d3.select(this).call(d3.axisLeft().scale(d3_scale).tickValues(tick_values).tickSize(15));
            })

        // Lines
        svg.selectAll("lollipopLine")
            .data(data)
            .enter()
            .append("line")
            .attr("x1", function(d) { return x(d.id); })
            .attr("x2", function(d) { return x(d.id); })
            .attr("y1", function(d) { return mapper.map(d[dimension]); })
            .attr("y2", mapper.map(mapper.get_input_space_ranges()[0][0]))
            .attr("stroke", "grey")

        // Circles
        svg.selectAll("mycircle")
            .data(data)
            .join("circle")
            .attr("cx", function(d) { return x(d.id); })
            .attr("cy", function(d) { return mapper.map(d[dimension]); })
            .attr("r", "4")
            .style("fill", "#69b3a2")
            .attr("stroke", "black")

    }


}