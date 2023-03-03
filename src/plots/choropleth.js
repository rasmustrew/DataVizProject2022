import * as d3 from "d3";

export default class Choropleth {

    constructor(container_ref, data, raw_mappers, selected_dimension) {
        this.container_ref = container_ref
        this.init(data, raw_mappers, selected_dimension)
    }

    init(data, raw_mappers, dimension) {
        // set the dimensions and margins of the graph
        let margin = {top: 0, right: 30, bottom: 30, left: 30},
            width = 1000 - margin.left - margin.right,
            height = 600 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        let svg = d3.select(this.container_ref)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

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
            d3.select(this)
                .transition()
                .duration(200)
                .style("opacity", 1)
            tooltip.style("opacity", 1)
        }

        const mouseMove = function(event,d) {
            tooltip
                .html("The " + dimension + " of<br>" + d.properties["name"] + " is: " + d.value)
                .style("left", (event.x)/2 + "px")
                .style("top", (event.y)/2 + "px")
        }

        let mouseLeave = function(d) {
            d3.selectAll(".Country")
                .transition()
                .duration(200)
                .style("opacity", .7)
                .style("stroke", null)
            tooltip.style("opacity", 0)
        }
        // Color scale
        const colorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain([0, 1])

        let country_to_index = {}
        for (let i in data) {
            const row = data[i]
            const iso_code = row["code"]
            country_to_index[iso_code] = parseInt(i)
        }
        // Load external data and boot
        Promise.all([
            d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"), []
        ]).then(function(loadData){
            let topo = loadData[0]
            topo.features = topo.features.filter(shape => shape.id !== "ATA")

            // Projection and size
            const projection = d3.geoMercator()
                .fitSize([width, height], topo);

            // Draw the map
            svg.selectAll("path")
                .data(topo.features)
                .join("path")
                // draw each country
                .attr("d", d3.geoPath()
                    .projection(projection)
                )
                // set the color of each country
                .attr("fill", function (d) {
                    if (!(d.id in country_to_index)) {
                        console.log("Couldn't find " + d.id + " in index map")
                        return 0
                    }
                    let country_index = country_to_index[d.id]
                    d.value = data[country_index][dimension] || 0;
                    return colorScale(raw_mappers[dimension].map(d.value));
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

