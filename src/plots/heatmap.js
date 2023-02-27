import * as d3 from "d3";

export default class HeatMap {

    constructor(container_ref, data, raw_mappers) {
        this.container_ref = container_ref
        this.data = data
        this.raw_mappers = raw_mappers
        this.init()
    }

    async init() {
        // set the dimensions and margins of the graph
        let margin = {top: 30, right: 30, bottom: 30, left: 30},
            width = 450 - margin.left - margin.right,
            height = 450 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        let svg = d3.select(this.container_ref)
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
            let value = parseInt(row["value"])
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

        // create a tooltip
        const tooltip = d3.select(this.container_ref)
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")

        // Three function that change the tooltip when user hover / move / leave a cell
        const mouseover = function(event,d) {
            tooltip.style("opacity", 1)
        }
        const mousemove = function(event,d) {
            tooltip
                .html("The exact value of<br>this cell is: " + d.value)
                .style("left", (event.x)/2 + "px")
                .style("top", (event.y)/2 + "px")
        }
        const mouseleave = function(d) {
            tooltip.style("opacity", 0)
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
            .style("fill", d => myColor(this.raw_mappers["value"].map(d.value)))
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)


        //Title
        svg.append("text")
            .attr("x", 0)
            .attr("y", -12)
            .style("font-size", "22px")
            .text("Geospatial heatmap");
    }

}