import * as d3 from "d3";

export default class ScatterPlot {

    constructor(chart_ref, data, selected_dimensions, raw_mappers) {
        this.chart_ref = chart_ref
        this.data = data
        this.mappers = raw_mappers
        this.dimensions = selected_dimensions
        if (this.dimensions.length > 1)
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

        // Add scales and ticks
        const x_dimension = this.dimensions[0]
        const y_dimension = this.dimensions[1]
        const space_between_ticks = 50
        const x_ticks = Math.floor(width / space_between_ticks)
        const y_ticks = Math.floor(height / space_between_ticks)
        const tick_formatter = Intl.NumberFormat("en-GB", { maximumSignificantDigits: 3 })

        var x = d3.scaleLinear()
            .domain([0, 1])
            .range([0, width])

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x)
                .tickSize(-height*1.3)
                .ticks(x_ticks)
                .tickFormat(d => tick_formatter.format(this.mappers[x_dimension].map_inverse(d))))
            .select(".domain").remove()

        var y = d3.scaleLinear()
            .domain([0, 1])
            .range([ height, 0])
            .nice()

        svg.append("g")
            .call(d3.axisLeft(y)
                .tickSize(-width*1.3)
                .ticks(y_ticks)
                .tickFormat(d => tick_formatter.format(this.mappers[y_dimension].map_inverse(d))))
            .select(".domain").remove()

        // Custom tick line
        svg.selectAll(".tick line").attr("stroke", "#EBEBEB")

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

        // Color scale
        const colorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain([0, 1])

        // Add dots
        svg.append('g')
            .selectAll("dot")
            .data(this.data)
            .enter()
            .append("circle")
            .attr("cx", d => x(this.mappers[x_dimension].map(d[x_dimension])))
            .attr("cy", d => y(this.mappers[y_dimension].map(d[y_dimension])))
            .attr("r", 5)
            .style("fill", d => {
                if (this.dimensions.length < 3)
                    return 0
                const dimension = this.dimensions[2]
                return colorScale(this.mappers[dimension].map(d[dimension]))
            })

    }
}

