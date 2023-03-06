import * as d3 from "d3";
import ScreenMapper from "../mappings/screen_mapping";
import CompositeMapper from "../mappings/composite_mapping";

export default class Lollipop {
    constructor(chart_ref, data, dimension, raw_mapper) {
        let plot = document.querySelector(chart_ref)

        let buffer_size = 20;
        let margin = {top: 80, right: 16, bottom: 80, left: 64};
        let width = plot.clientWidth - margin.left - margin.right;
        let height = plot.clientHeight - margin.top - margin.bottom;
        let screen_mapper = new ScreenMapper(raw_mapper.get_output_space_ranges(), [height, 0], buffer_size)
        let mapper = new CompositeMapper([raw_mapper, screen_mapper])

        // append the svg object to the body of the page
        const svg = d3.select(chart_ref).append("svg")
            .attr("class", "lollipopSvg")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        for (let index = 0; index < mapper.get_input_space_ranges().length; index++) {
            console.log(index)
            let base_svg = svg.append('g').attr("class", "lollipopSvg")
            this.create_single_axis_lollipop(data, base_svg, mapper, index, dimension, width, buffer_size)
        }

    }

    create_single_axis_lollipop(data, base_svg, mapper, index, dimension, width, buffer) {
        let screen_range = mapper.get_output_space_ranges()[index]
        let input_ranges = mapper.get_input_space_ranges()
        let input_range = input_ranges[index]
        // Add X axis
        const x = d3.scaleBand()
            .range([ 0, width ])
            .domain(data.map(function(d) { return d.id; }))
            .padding(1);

        let axis_x = base_svg.append('g')
            .attr("class", "x_axis")
            .attr("transform", `translate(0, ${mapper.map(input_range[0])})`)

        if (index === 0) {
            axis_x.call(d3.axisBottom(x))
                .selectAll("text")
                .attr("transform", "translate(-10,0)rotate(-45)")
                .style("text-anchor", "end");
        } else {
            axis_x.call(d3.axisBottom(x).tickValues([]))
        }

        let axis_x_top = base_svg.append('g')
            .attr("class", "x_axis")

        if (index === mapper.get_input_space_ranges().length - 1) {
            axis_x_top.attr("transform", `translate(0, ${mapper.map(input_range[1])})`)
                .call(d3.axisTop(x))
        } else {
            axis_x_top.attr("transform", `translate(0, ${mapper.map(input_range[1]) + buffer})`)
                .call(d3.axisTop(x).tickValues([]))
        }
        axis_x_top.selectAll("text")
            .attr("transform", "translate(-10,0)rotate(45)")
            .style("text-anchor", "end");


        // Add Y axis
        let tick_values = []
        if (index === 0) {
            tick_values = input_range;
        } else if (index === input_ranges.length - 1) {
            tick_values = [input_range[1]];
        } else {
            tick_values = [input_range[1]];
        }
        let d3_scale = d3.scaleLinear().domain(input_range).range(screen_range)
        let axis_y = base_svg.append('g')
            .attr("class", "y_axis")
            .call(d3.axisLeft().scale(d3_scale).tickValues(tick_values).tickSize(15));

        axis_y.append("text")
            .style("text-anchor", "middle")
            .style("font-weight", 400)
            .style("overflow", "visible")
            .attr("y", -8)
            .text(dimension);
        // Lines
        base_svg.selectAll("lollipopLine")
            .data(data.filter((d) => d[dimension] >= input_range[0]))
            .enter()
            .append("line")
            .attr("x1", function(d) { return x(d.id); })
            .attr("x2", function(d) { return x(d.id); })
            .attr("y1", function(d) {
                if (d[dimension] >= input_range[1]) {
                    return mapper.map(input_range[1]) + buffer;
                } else {
                    return mapper.map(d[dimension])
                }

            })
            .attr("y2", mapper.map(input_range[0]))
            .attr("stroke", "grey")

        // Tooltip
        let tooltip = d3.select(this.chart_ref).append("g").attr("class", "tooltip")

        // Mouse callbacks
        let mouseover = function(event,d) {
            tooltip.style("visibility", "visible")
        }

        let mousemove = (event, d) => {
            tooltip.html("The " + dimension + " of" + d.id + " is:<br>" + mapper.map(d[dimension]))
                .style("left", event.x + "px")
                .style("top", (event.y + 20) + "px")
        }
        let mouseleave = function(d) {
            tooltip.style("visibility", "hidden")
        }

        // Circles
        base_svg.selectAll("mycircle")
            .data(data)
            .join("circle")
            .attr("cx", function(d) { return x(d.id); })
            .attr("cy", function(d) { return mapper.map(d[dimension]); })
            .attr("r", "4")
            .style("fill", "#69b3a2")
            .attr("stroke", "black")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
}

}