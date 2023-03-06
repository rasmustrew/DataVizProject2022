import * as d3 from "d3";

export default class HeatMap {

    constructor(chart_ref, data, mappers, selected_dimension) {
        this.chart_ref = chart_ref
        this.data = data
        this.mappers = mappers
        this.dimension = selected_dimension
        this.init()
    }

    async init() {
        let plot = document.querySelector(this.chart_ref)
        // set the dimensions and margins of the graph
        let margin = {top: 30, right: 30, bottom: 30, left: 30},
            width = plot.clientHeight + 50 - margin.left - margin.right,
            height = plot.clientHeight - margin.top - margin.bottom;

        // append the svg object to the body of the page
        let svg = d3.select(this.chart_ref)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // Labels of row and columns
        let xKeys = [], yKeys = [], max_value = 0
        for (const row of this.data) {
            let xKey = row["x"]
            let yKey = row["y"]
            let value = parseInt(row[this.dimension])
            if (!xKeys.includes(xKey)) xKeys.push(xKey)
            if (!yKeys.includes(yKey)) yKeys.push(yKey)
            if (value > max_value) max_value = value
        }

        // Build X scales and axis:
        let x = d3.scaleBand()
            .range([ 0, width ])
            .domain(xKeys)
            .padding(0);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))

        // Build Y scales and axis:
        let y = d3.scaleBand()
            .range([ height, 0 ])
            .domain(yKeys)
            .padding(0.01);
        svg.append("g")
            .call(d3.axisLeft(y));

        // Tooltip
        const tooltip = d3.select(this.chart_ref)
            .append("g")
            .attr("class", "tooltip")

        // Mouse callbacks
        const mouseover = function(event,d) {
            tooltip.style("visibility", "visible")
        }
        let value_row = this.dimension
        const mousemove = (event, d) => {
            tooltip
                .html("(" + d.x + ", " + d.y + ")" + "<br>"
                    + d[value_row] + " " + this.dimension)
                .style("left", event.x + "px")
                .style("top", (event.y + 20) + "px")
        }
        const mouseleave = function(d) {
            tooltip.style("visibility", "hidden")
        }

        // Build color scale
        let myColor = d3.scaleSequential(d3.interpolateViridis)
            .domain([0, 1])

        svg.selectAll("rect")
            .data(this.data)
            .enter()
            .append("rect")
            .attr("x", d => x(d.x))
            .attr("y", d => y(d.y))
            .attr("width", x.bandwidth() )
            .attr("height", y.bandwidth() )
            .style("fill", d => myColor(this.mappers[value_row].map(d[value_row])))
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)


        //Title
        svg.append("text")
            .attr("x", 0)
            .attr("y", -10)
            .style("font-size", "22px")
            .text("Geospatial heatmap " + this.dimension);
    }

}