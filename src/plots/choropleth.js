import * as d3 from "d3";
import {v4 as uuidv4} from "uuid";

export default class Choropleth {

    constructor(chart_ref, data, selected_dimension, raw_mappers) {
        this.chart_ref = chart_ref
        this.init(data, raw_mappers, selected_dimension)
    }

    init(data, raw_mappers, dimension) {
        let plot = document.querySelector(this.chart_ref)
        // set the dimensions and margins of the graph
        let margin = {top: 0, right: 30, bottom: 30, left: 30},
            width = plot.clientWidth - margin.left - margin.right,
            height = plot.clientHeight - margin.top - margin.bottom;

        // append the svg object to the body of the page
        let svg = d3.select(this.chart_ref)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // Tooltip
        const tooltip = d3.select(this.chart_ref).append("g").attr("class", "tooltip")

        // Mouse callbacks
        let mouseover = function(event,d) {
            tooltip.style("visibility", "visible")
        }

        let mousemove = (event, d) => {
            tooltip
                .html("The " + dimension + " of" + d.properties["name"] + " is:<br>" + d.value)
                .style("left", event.x + "px")
                .style("top", (event.y + 20) + "px")
        }
        let mouseleave = function(d) {
            tooltip.style("visibility", "hidden")
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
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)
        })
    }
}

