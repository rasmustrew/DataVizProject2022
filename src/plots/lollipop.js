import {v4 as uuidv4} from "uuid";
import * as d3 from "d3";
export default class Lollipop {
    constructor(container_ref, data, dimensions, raw_mappers) {
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

        // append the svg object to the body of the page
        const svg = d3.select(this.id).append("svg").attr("class", "lollipopSvg")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        let current_dimension = dimensions[0]

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

        // Add Y axis
        const y = d3.scaleLinear()
            .domain(raw_mappers[current_dimension].get_input_space_ranges()[0])
            .range([ height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));

        // Lines
        svg.selectAll("lollipopLine")
            .data(data)
            .enter()
            .append("line")
            .attr("x1", function(d) { return x(d.id); })
            .attr("x2", function(d) { return x(d.id); })
            .attr("y1", function(d) { return y(d[current_dimension]); })
            .attr("y2", y(0))
            .attr("stroke", "grey")

        // Circles
        svg.selectAll("mycircle")
            .data(data)
            .join("circle")
            .attr("cx", function(d) { return x(d.id); })
            .attr("cy", function(d) { return y(d[current_dimension]); })
            .attr("r", "4")
            .style("fill", "#69b3a2")
            .attr("stroke", "black")

    }
}