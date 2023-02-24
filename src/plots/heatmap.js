import * as d3 from "d3";

export default class HeatMap {

    constructor(container_ref, data, dimensions, raw_mappers) {
        this.container_ref = container_ref
        this.init()
    }

    init() {
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
        let myGroups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
        let myVars = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10"]

        // Build X scales and axis:
        let x = d3.scaleBand()
            .range([ 0, width ])
            .domain(myGroups)
            .padding(0);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))

        // Build X scales and axis:
        let y = d3.scaleBand()
            .range([ height, 0 ])
            .domain(myVars)
            .padding(0.01);
        svg.append("g")
            .call(d3.axisLeft(y));

        // Build color scale
        let myColor = d3.scaleLinear()
            .range(["white", "#69b3a2"])
            .domain([1,100])

        //Read the data
        d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/heatmap_data.csv", line => {
            //console.log(line)
            svg.selectAll()
                .data(line, d => d.group + ':' + d.variable)
                .enter()
                .append("rect")
                .attr("x", d => x(d.group))
                .attr("y", d => y(d.variable))
                .attr("width", x.bandwidth() )
                .attr("height", y.bandwidth() )
                .style("fill", function(d) { return myColor(d.value)} )
        })

        //Title
        svg.append("text")
            .attr("x", 0)
            .attr("y", -50)
            .style("font-size", "22px")
            .text("Why does the title not appear?");
    }

}