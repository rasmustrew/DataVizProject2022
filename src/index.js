import * as d3 from "d3";


var margin = {top: 16, right: 48, bottom: 16, left: 48},
    width = document.querySelector("#parCoordsDiv").clientWidth - margin.left - margin.right,
    height = document.querySelector("#parCoordsDiv").clientHeight - margin.top - margin.bottom;

var indices_ranges = {
    'crime_index': [0, 100],
    'traffic_index': [0, 320],//unbounded max
    'rent_index': [0, 80],//unbounded max, 100 is new york
    'groceries_index': [0, 150],//unbounded max, 100 is new york
    'restaurant_price_index': [0, 125],//unbounded max, 100 is new york
    'pollution_index': [0, 100],//actual values seem to be going to 113?
    'health_care_index': [0, 100],
    'quality_of_life_index': [0, 200],//unbounded

    'traffic_time_index': [0, 100],//unboundex max?
    'purchasing_power_incl_rent_index': [0, 150],//unbounded max, 100 is new york
    'cpi_index': [0, 150],//unbounded max, 100 is new york
    'cpi_and_rent_index': [0, 200],//unbounded max, 100 is new york
    'safety_index': [100, 0],
    'traffic_co2_index': [0, 30000],//unbounded max
    'traffic_inefficiency_index': [0, 700],//unbounded max
    'property_price_to_income_ratio': [0, 150],//unbounded max
    'climate_index': [-100, 100]
}


var svg = d3.select("#parCoordsDiv").append("svg")
    .attr("id", "parcoordsSvg")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .on('mouseleave', function(d) {
        d3.select("#hoverBox")
            .style("visibility", "hidden")
    });
var foreground;
var background;
var filtered_data;

var dimensions = [
    'crime_index', 'traffic_index', 'rent_index', 'groceries_index',
    'restaurant_price_index', 'pollution_index', 'health_care_index', 'quality_of_life_index']

var x = d3.scalePoint().domain(dimensions).range([0, width])
var y = {}


d3.csv("../country_indices.csv").then(function (data) {

    console.log(data)
    filtered_data = data.filter(row => row["quality_of_life_index"] !== "-1")

    dimensions.forEach(function(d) {
        y[d] = d3.scaleLinear()
            .domain(indices_ranges[d])
            .range([height, 0]);
    })

    // // Add a group element for each dimension.
    var axis_groups = svg.selectAll(".dimension")
        .data(dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(dimension_name) { return "translate(" + x(dimension_name) + ")"; })

    // Add an axis and title for each dimension.
    var axes = axis_groups.append("g")
        .attr("class", "axis")
        .each(function(d) {d3.select(this).call(d3.axisLeft(y[d])); })
        .append("text")
        .style("text-anchor", "middle")
        .style("font-weight", 400)
        .style("overflow", "visible")
        .attr("y", -8)
        .text(function(dimension_name) {
            return dimension_name;
        });

    // Add and store a brush for each axis, allows the dragging selection on each axis.
    axis_groups.append("g")
        .attr("class", "brush")
        .each(function(d) {
            let range = y[d].range();
            y[d].brush = d3.brushY()
                .extent([[-8, range[1]], [8, range[0]]])
                .on("brush", brushed)
            d3.select(this).call(y[d].brush);
            y[d].svg = this;
        })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);


    //Add grey background lines for context.
    background = svg.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(filtered_data)
        .enter().append("path")
        .attr("d", path);

    // Add coloured foreground lines for focus.
    foreground = svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(filtered_data)
        .enter().append("path")
        // .attr("stroke", "d00")
        // .attr("stroke", row => color_continents(row["continent"]))
        .attr("d", path)
        // make the cursor a pointer when hovering the lines
        .attr("pointer-events", "visiblePainted")
        .attr("cursor", "pointer")
        .attr("stroke-width", "2px")
        //handle hover and click events
        .on('mouseover', onHoverLine);

});

// Returns the path for a given data point.
function path(data_point) {
    let path = d3.path();
    let first_val = data_point[dimensions[0]]
    path.moveTo(x(dimensions[0]), y[dimensions[0]](first_val))
    dimensions.slice(1).map(function(dimension) {
        let val = data_point[dimension];
        path.lineTo(x(dimension), y[dimension](val));
    });
    return path
}

function onHoverLine(mouse_event, data) {
    d3.select("#hoverBox")
        .style("visibility", "visible")
        .style("top", mouse_event.clientY + 'px')
        .style("left", mouse_event.clientX + 8 + 'px')
        .text(data.name)
}

// Handles a brush event, toggling the display of foreground lines.
function brushed(event) {
    console.log(event)
    console.log("calling brush")
    // active_dimensions is a list of dimensions currently being filtered upon
    var active_dimensions = dimensions.filter(function(dimension) {
        return d3.brushSelection(y[dimension].svg) != null;
    });
    console.log(active_dimensions)
    // extents is the corresponding min and max of the filter on each dimensions
    var extents = active_dimensions.map(function(dimension) {
        let screenspace_selection = d3.brushSelection(y[dimension].svg);
        console.log(screenspace_selection)
        let dataspace_selection = screenspace_selection.map(function (screenspace_position) {
            return y[dimension].invert(screenspace_position)
        })
        return dataspace_selection;
    });
    console.log(extents)

    // return the datapoints where all the filter parameters are within the extents
    var selected = filtered_data.filter(data_point =>
        active_dimensions.every(
            (dimension, index) =>
                extents[index][1] <= data_point[dimension] && data_point[dimension] <= extents[index][0]
        )
    )
    console.log(selected)
    var selected_iso3 = selected.map(function (data_point) {
        return data_point.iso3
    })

    console.log(selected_iso3)

    updateParCoords(selected_iso3)
}

function updateParCoords(selected_iso3) {
    // If the svg has not finished rendering for the first time yet, just return.
    if (!foreground) {
        return
    }
    foreground.style("display", function(data_point) {
        if (selected_iso3.length === 0) return 'none'
        if (selected_iso3.includes(data_point.iso3)) {
            return null
        }
        else {
            return 'none'
        }
    });

}