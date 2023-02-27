import * as d3 from "d3";

export default class HeatMap {

    constructor(container_ref, data, raw_mappers, selected_dimension) {
        this.container_ref = container_ref
        this.data = data
        this.raw_mappers = raw_mappers
        this.dimension = selected_dimension
        this.init()
    }

    init() {
        // set the dimensions and margins of the graph
        let margin = {top: 30, right: 30, bottom: 30, left: 30},
            width = 450 - margin.left - margin.right,
            height = 350 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        let svg = d3.select(this.container_ref)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // Map and projection
        const path = d3.geoPath();
        const projection = d3.geoMercator()
            .scale(70)
            .center([0,20])
            .translate([width / 2, height / 2]);

        // Data and color scale
        let data = new Map()
        const colorScale = d3.scaleThreshold()
            .domain([100000, 1000000, 10000000, 30000000, 100000000, 500000000])
            .range(d3.schemeBlues[7]);

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

        let mouseOver = function(d) {
            d3.selectAll(".Country")
                .transition()
                .duration(200)
                .style("opacity", .5)
            tooltip.style("opacity", 1)
        }

        const mouseMove = function(event,d) {
            tooltip
                .html("The population of<br>" + d.properties["name"] + " is: " + d.total.toLocaleString('en-GB'))
                .style("left", (event.x)/2 + "px")
                .style("top", (event.y)/2 + "px")
        }

        let mouseLeave = function(d) {
            d3.selectAll(".Country")
                .transition()
                .duration(200)
                .style("opacity", .8)
            tooltip.style("opacity", 0)
        }

        // Load external data and boot
        Promise.all([
            d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
            d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world_population.csv", function(d) {
                data.set(d.code, +d.pop)
            })
        ]).then(function(loadData){
            let topo = loadData[0]

            // Draw the map
            svg.append("g")
                .selectAll("path")
                .data(topo.features)
                .join("path")
                // draw each country
                .attr("d", d3.geoPath()
                    .projection(projection)
                )
                // set the color of each country
                .attr("fill", function (d) {
                    d.total = data.get(d.id) || 0;
                    return colorScale(d.total);
                })
                .style("stroke", "transparent")
                .attr("class", function(d){ return "Country" } )
                .style("opacity", .8)
                .on("mouseover", mouseOver )
                .on("mousemove", mouseMove)
                .on("mouseleave", mouseLeave )
        })
    }
}

