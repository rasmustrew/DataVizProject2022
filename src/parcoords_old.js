const pcTitleElement = document.getElementById('pcTitle')

var margin = {top: 16, right: 8, bottom: 16, left: 8},
    width = document.querySelector("#parCoordsDiv").clientWidth - margin.left - margin.right,
    height = document.querySelector("#parCoordsDiv").clientHeight - margin.top - margin.bottom;

var legend_width = document.querySelector("#parCoordsLegendDiv").clientWidth
var legend_height = document.querySelector("#parCoordsLegendDiv").clientHeight
//console.log("width: ", width)
//console.log("height: ", height)
var x = d3.scale.ordinal().rangePoints([0, width], 1),
    y = {},
    dragging = {};

var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    background,
    foreground;

var svg = d3.select("#parCoordsDiv").append("svg")
    // .attr("width", width + margin.left + margin.right)
    // .attr("height", height + margin.top + margin.bottom)
    .attr("id", "parcoordsSvg")
    .on('mouseleave', function(d) {
        hoverBox = d3.select("#hoverBox")
            .style("visibility", "hidden")
    })
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var legend = d3.select('#parCoordsLegendDiv').append('svg')
    .attr('id', 'parCoordsLegendSvg');
var selectedLegendItemsP = [];
var colorsPLegend;
var continents, color_continents;
var axises;
var legendUsedForColoringPC = true;

original_rows = []

function setupIndexFilePC(launch) {
    d3.csv("country_indices.csv", function(error, rows) {
        original_rows = rows
        if (launch) launchParCoordsIndices()
    });
}
setupIndexFilePC(true)

const colsToIgnore = ["name", "iso2", "iso3", "continent", "region"]

function getContinuousColumns(row) {
    return d3.keys(row).filter(d => !colsToIgnore.includes(d));
}

function launchParCoordsIndices() {
    clearParCoords();
    pcTitleElement.textContent = "Index parallel coordinates diagram"
    // Separate the countries with missing data from the rest, they will be handled seperately
    rows_with_all_data = original_rows.filter(row => row["quality_of_life_index"] !== "-1")
    rows_with_missing_data = original_rows.filter(row => row["quality_of_life_index"] == "-1")

    // Extract the list of dimensions and create a scale for each.

    starting_columns = [
        'crime_index', 'traffic_index', 'rent_index', 'groceries_index',
        'restaurant_price_index', 'pollution_index', 'health_care_index', 'quality_of_life_index'
    ]
    x.domain(dimensions = starting_columns);

    // Set the scale for the y axis, on each dimension
    starting_columns.forEach(function(d) {
        y[d] = d3.scale.linear()
            .domain(indices_ranges[d])
            .range([height, 0]);
    })

    // Create a color scale for the continents
    continents = d3.map(rows_with_all_data, function(d){return d.continent;}).keys()
    color_continents = d3.scale.ordinal()
        .domain(continents)
        .range(['#e41a1c80','#377eb880','#4daf4a80','#984ea380','#ff7f0080','#ffff3380']);
    colorsPLegend = color_continents;
    if (selectedLegendItemsP.length === 0) selectedLegendItemsP = [...continents];
    // Create the legend
    makeParCoordsLegend(continents, selectedLegendItemsP, color_continents, onParCoordsLegendClick);

    var regions = d3.map(rows_with_all_data, function(d){return d.region;}).keys()

    // Initialize the selected countries to all countries
    var iso3_codes = d3.map(original_rows, function(d){return d.iso3;}).keys()
    filterByParCoords(iso3_codes)

    // Sort the datapoints by continent, this will make all of the datapoint in the same continent by drawn together
    // hopefully making a less cluttered graph
    rows_with_all_data.sort((a, b) => d3.ascending(a.continent, b.continent));

    // Add grey background lines for context.
    background = svg.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(rows_with_all_data)
        .enter().append("path")
        .attr("d", path_country);

    // Add coloured foreground lines for focus.
    foreground = svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(rows_with_all_data)
        .enter().append("path")
        .attr("stroke", row => color_continents(row["continent"]))
        .attr("d", path_country)
        // make the cursor a pointer when hovering the lines
        .attr("pointer-events", "visiblePainted")
        .attr("cursor", "pointer")
        .attr("stroke-width", "2px")
        //handle hover and click events
        .on('mouseover', onMouseOver)
        .on('mousedown', function (d) {
            updateSingleSelect(d['iso3'])
        })




    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
        .data(dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        // Make the dimension dragable, allowing to swap the position of 2 axis/dimensions
        .call(d3.behavior.drag()
            .origin(function(d) { return {x: x(d)}; })
            .on("dragstart", function(d) {
                dragging[d] = x(d);
                background.attr("visibility", "hidden");
            })
            .on("drag", function(d) {
                dragging[d] = Math.min(width, Math.max(0, d3.event.x));
                foreground.attr("d", path_country);
                dimensions.sort(function(a, b) { return position(a) - position(b); });
                x.domain(dimensions);
                g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
            })
            .on("dragend", function(d) {
                delete dragging[d];
                transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
                transition(foreground).attr("d", path_country);
                background
                    .attr("d", path_country)
                    .transition()
                    .delay(500)
                    .duration(0)
                    .attr("visibility", null);
            }));



    // Add an axis and title for each dimension.
    axises = g.append("g")
        .attr("class", "axis")
        .each(function(d) {d3.select(this).call(axis.scale(y[d])); })
        .append("text")
        .style("text-anchor", "middle")
        .style("font-weight", 400)
        .style("overflow", "visible")
        .attr("y", -8)
        .text(function(d) {
            let words = d.split("_")
            words.pop()
            for (var i = 0; i < words.length; i++) {
                words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
            }
            let title = words.join(" ")
            return title;
        })
        .on('click', d => {
            legendUsedForColoringPC = (d === selected_column && !legendUsedForColoringPC);
            updateColumn(d);
        });

    // Add and store a brush for each axis, allows the dragging selection on each axis.
    g.append("g")
        .attr("class", "brush")
        .each(function(d) {
            d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
        })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);


    // Handle the countries with missing data
    // Add a circle on each dimension (that the country has data for) representing that country.
    background_circles = g.append("g")
        .attr("class", "background")
        .selectAll("circle")
        .data(rows_with_missing_data)
        .enter().append("circle")
        .filter(function (data_point) {
            var dim = this.parentNode.__data__
            var val = data_point[dim]
            return val != -1
        })
        .attr("r", 3)
        .attr("cx", 0)
        .attr("cy", function (data_point) {
            var dim = this.parentNode.__data__
            var val = Math.min(data_point[dim], indices_ranges[dim][1])
            return y[dim](val)
        })
        // make the mouse a pointer when hovering the circles
        .attr("pointer-events", "visiblePainted")
        .attr("cursor", "pointer")
        // Handle hover and click events
        .on('mouseover', onMouseOver)
        .on('mousedown', function (d) {
            console.log(d)
            updateSingleSelect(d['iso3'])
        })

    foreground_circles = g.append("g")
        .attr("class", "foreground")
        .selectAll("circle")
        .data(rows_with_missing_data)
        .enter().append("circle")
        .filter(function (data_point) {
            var dim = this.parentNode.__data__
            var val = data_point[dim]
            return val != -1
        })
        .attr("r", 3)
        .attr("fill", function (data_point) {
            return color_continents(data_point['continent'])
        })
        .attr("cx", 0)
        .attr("cy", function (data_point) {
            var dim = this.parentNode.__data__
            var val = Math.min(data_point[dim], indices_ranges[dim][1])
            return y[dim](val)
        })
        // make the mouse a pointer when hovering the circles
        .attr("pointer-events", "visiblePainted")
        .attr("cursor", "pointer")
        // Handle hover and click events
        .on('mouseover', onMouseOver)
        .on('mousedown', function (d) {
            console.log(d)
            updateSingleSelect(d['iso3'])
        })
}

function makeParCoordsLegend(categories, selection, colors, onClick) {
    legend.selectAll('circle')
        .data(categories)
        .enter()
        .append('circle')
        .attr('cy', 16)
        .attr('cx', function (d, i) {
            let distance = legend_width/(categories.length + 1)
            return distance + i*distance
        })
        .attr('r', 8)
        .style('fill', filteredLegendColors(colors, selection))
        .on('mousedown', onClick);
    legend.selectAll('text')
        .data(categories)
        .enter()
        .append('text')
        .style("text-anchor", "middle")
        .attr("y", 32)
        .attr("x", function (d, i) {
            let distance = legend_width/(categories.length + 1)
            return distance + i*distance
        })
        .text(function(d) { return d; })
        .on('mousedown', onClick)
}

// Update which color scale is used to draw the lines
function updatePCColorScaleToColumn(col) {
    // Change colors of all lines
    if (legendUsedForColoringPC) {   // Categorical
        col = "continent"
        foreground.style("stroke", row => color_continents(row[col]))
        foreground_circles.style("fill", row => color_continents(row[col]))
    } else {                            // Continuous
        color_scale_column = col
        console.log(indices_ranges[col])
        let color = d3.scale.linear()
            .domain(rangeToDomain(indices_ranges[col][0], indices_ranges[col][1], 23))
            .range(color_range_alpha)
        foreground.style("stroke", row => {
            let value = row[col]
            if (value == -1) {
                return color_missing_data
            }
            return color(row[col])
        })
        foreground_circles.style("fill", row => {
            let value = row[col]
            if (value == -1) {
                return color_missing_data
            }
            return color(row[col])
        })
    }
    // Make dimension axis title bold
    axises.style("font-weight", (index) => {
        if (index.replace("_", " ") === col.replace("_", " ")) return 700;
        return 400;
    })
}

// Update colors of legend and which lines are selected based on legend filter
function updateParCoordsLegend(colors, selection) {
    legend.selectAll('circle').style('fill', filteredLegendColors(colors, selection))
}

function onParCoordsLegendClick(cat) {
    if (selectedLegendItemsP.includes(cat)) {
        selectedLegendItemsP.splice(selectedLegendItemsP.indexOf(cat), 1)
    } else {
        selectedLegendItemsP.push(cat)
    }
    // Show marked categories in legend
    updateParCoordsLegend(colorsPLegend, selectedLegendItemsP)
    // Set legend as color scale
    legendUsedForColoringPC = true
    updatePCColorScaleToColumn(selected_column)
    // Recalculate selected items
    brush()
}

function onMouseOver(d, index, elements) {
    mouse_position = d3.mouse(document.body)
    // console.log(d3.mouse(elements[index])[0])
    hoverBox = d3.select("#hoverBox")
        .style("visibility", "visible")
        .style("top", mouse_position[1] + 'px')
        .style("left", mouse_position[0] + 8 + 'px')
        .text(d.name)
}

function filteredLegendColors(colors, selection) {
    return (cat) => {
        const color = colors(cat)
        if (selection.includes(cat)) return color;
        else return "#888888";
    }
}

// returns the x position of a dimension (where the axis is placed)
function position(d) {
    var v = dragging[d];
    return v == null ? x(d) : v;
}

// enables smooth transition between 2 positions.
function transition(g) {
    return g.transition().duration(500);
}

// Returns the path for a given data point.
function path_country(data_point) {
    return line(dimensions.map(function(dimension) {
        let val = Math.min(data_point[dimension], indices_ranges[dimension][1]);
        return [position(dimension), y[dimension](val)];
    }));
}

function brushstart() {
    d3.event.sourceEvent.stopPropagation();
}

// update which lines are shown as "selected"
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

    foreground_circles.style("display", function(data_point) {
        if (selected_iso3.length === 0) return 'none'
        if (selected_iso3.includes(data_point.iso3)) {
            return null
        }
        else {
            return 'none'
        }
    });
}

function clearParCoords() {
    svg.selectAll("path").remove()
    svg.selectAll("circle").remove()
    svg.selectAll(".dimension").remove()
    legend.selectAll("circle").remove()
    legend.selectAll("text").remove()
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
    // active_dimensions is a list of dimensions currently being filtered upon
    var active_dimensions = dimensions.filter(function(p) { return !y[p].brush.empty(); });
    // extents is the corresponding min and max of the filter on each dimensions
    var extents = active_dimensions.map(function(p) { return y[p].brush.extent(); });

    // return the datapoints where all the filter parameters are within the extents
    var selected = original_rows.filter(data_point =>
        active_dimensions.every(
            (dimension, index) =>
                extents[index][0] <= data_point[dimension] && data_point[dimension] <= extents[index][1]
        )
    )
    selected = selected.filter(row => selectedLegendItemsP.includes(row["continent"]))
    selected_iso3 = selected.map(function (data_point) {
        return data_point.iso3
    })
    filterByParCoords(selected_iso3)
}

