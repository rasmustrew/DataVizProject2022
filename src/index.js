import * as d3 from "d3";
import SPC from "./plots/spc";
import {greedy_guided_split, read_greedy_guided_split_args} from "./algorithms/greedy_guided_split/greedy_guided_split"
import {load_periodic_table_data} from "./data/load_periodic_table_data";
import {load_un_data} from "./data/load_un_data";
import {hardcoded_periodic_table_get_mapper} from "./algorithms/hardcoded_splits";
import HeatMap from "./plots/heatmap";
import Choropleth from "./plots/choropleth";
import {quantile_splits} from "./algorithms/quantile_splits";
import {kmeans_splits} from "./algorithms/kmeans_split";
import {load_heatmap_data} from "./data/load_heatmap_csv";
import Lollipop from "./plots/lollipop";
import LinearMapper from "./mappings/linear_mapping";

console.log("starting")

const chart_container_ref = "#plot_container_id"
const data_selector_id = "data-select"
const data_selector_ref = "#" + data_selector_id
const algo_selector_ref = "#algorithm-select"

class DataSource {
    constructor(data, dimensions, mappers) {
        this.data = data
        this.dimensions = dimensions
        this.mappers = mappers
    }
}

let data_source = null;
let read_number_of_clusters = () => ({clusters: parseInt(d3.select("#clusters input").property("value"))})

async function init() {
    let algo_selection = d3.select("#algorithm-select").property("value")
    update_selected_algorithm(algo_selection);
    update_data_set().then(create_plot)
}

function rebuild_plot() {
    clear_plot();
    create_plot();
}

function clear_plot() {
    d3.select(chart_container_ref).html("")
}

// Requires data_source to be initialized
function create_plot() {
    chart_generator(data_source.data, data_source.dimensions, data_source.mappers, selected_dimension)
}

let algorithm_selection_map = {
    greedy_guided_split: {
        algo: greedy_guided_split,
        arguments_id: "#greedy_guided_split_arguments",
        read_args: read_greedy_guided_split_args},
    hardcoded_periodic_table: {
        algo: hardcoded_periodic_table_get_mapper,
        arguments_id: null,
        read_args: () => {},
    },
    quantile: {
        algo: quantile_splits,
        arguments_id: "#greedy_guided_split_arguments",
        read_args: read_number_of_clusters
    },
    kmeans: {
        algo: kmeans_splits,
        arguments_id: "#greedy_guided_split_arguments",
        read_args: read_number_of_clusters
    },
    none: {
        algo: (sorted_data, args, dimension) => {
            return new LinearMapper([[sorted_data[0], sorted_data[sorted_data.length - 1]]], [0, 1])
        },
        arguments_id: null,
        read_args: () => {},
    }
}

function update_selected_algorithm(selection) {
    let {arguments_id} = algorithm_selection_map[selection];
    let args = d3.select("#arguments_div").selectChildren();
    args.style("display", "none")
    if (arguments_id !== null) {
        d3.select(arguments_id).style("display", null)
    }
}

let data_selection_map = {
    periodic_table: load_periodic_table_data,
    un_country_data: load_un_data,
    heatmap_data: () => load_heatmap_data("data"),
    heatmap_denmark: () => load_heatmap_data("denmark"),
    heatmap_europe: () => load_heatmap_data("europe")
}

async function update_data_set(selection) {
    if (selection == null) {
        selection = d3.select(data_selector_ref).property("value")
    }
    selected_dimension = null
    data_source = await prepare_data_set(selection)
    set_up_dimensions_selector(data_source.dimensions);
}

async function prepare_data_set(data_selection) {
    let data_function = data_selection_map[data_selection]
    let {data, dimensions} = await data_function();

    // Apply algorithm to relevant dimensions
    let algo_selection = d3.select(algo_selector_ref).property("value")
    let {algo, read_args} = algorithm_selection_map[algo_selection]
    let args = read_args()
    let mappers = {}
    for (let dimension of dimensions) {
        let data_values = data.map(value => value[dimension])
        data_values.sort(function (a, b) {
            return a - b;
        });
        // sorted_data[dimension] = data_values
        let mapper = algo(data_values, args, dimension)
        // let mapper = new LinearMapper([[data_values[0], data_values[data_values.length - 1]]], [0, 1])
        mappers[dimension] = mapper
    }
    return new DataSource(data, dimensions, mappers);
}

let selected_dimension = null

function set_up_dimensions_selector(dimensions) {
    let dimension_selector = document.getElementById("dimension-select")
    while (dimension_selector.firstChild) {
        dimension_selector.removeChild(dimension_selector.firstChild)
    }
    for (let dimension of dimensions) {
        const optionElement = document.createElement('option');
        optionElement.value = dimension;
        optionElement.text = dimension;
        dimension_selector.appendChild(optionElement);
    }
    if (selected_dimension == null || !dimensions.includes(selected_dimension)) {
        selected_dimension = dimension_selector.firstChild["value"]
    } else {
        for (let i = 0; i < dimension_selector.options.length; i++) {
            if (dimension_selector.options[i].value === selected_dimension) {
                dimension_selector.selectedIndex = i;
                break;
            }
        }
    }
}

let chart_selection_map = {
    spc: {
        chart_generator: (data, dimensions, mappers, selected_dimension) => {
            let spc = new SPC(chart_container_ref, data, dimensions, mappers)
            spc.draw()
        },
        ui_update: () => {}
    },
    heatmap: {
        chart_generator: (data, dimensions, mappers, selected_dimension) => {
            new HeatMap(chart_container_ref, data, mappers, selected_dimension)
        },
        ui_update: () => {
            let data_selector = document.getElementById(data_selector_id)
            if (!data_selector.value.toString().includes("heatmap")) {
                data_selector.selectedIndex = 2
            }
        }
    },
    choropleth: {
        chart_generator: (data, dimensions, mappers, selected_dimension) => {
            new Choropleth(chart_container_ref, data, mappers)
        },
        ui_update: () => {}
    },
    lollipop: {
        chart_generator: (data, dimensions, mappers, selected_dimension) => {
            new Lollipop(chart_container_ref, data, dimensions, mappers)
        },
        ui_update: () => {}
    }
}

let chart_generator = chart_selection_map["spc"]["chart_generator"];

window.select_data_set = (selection) => {
    console.log("selected data set: ", selection)
    update_data_set(selection).then(rebuild_plot);
}

window.select_data_dimension = (selection) => {
    console.log("selected dimension: ", selection)
    selected_dimension = selection
    rebuild_plot()
}

window.select_algorithm = (selection) => {
    console.log("selected algo: ", selection)
    update_selected_algorithm(selection);
    update_data_set().then(rebuild_plot);
}

window.select_chart = (selection) => {
    console.log("selected chart: ", selection)
    let chart_select = chart_selection_map[selection]
    chart_generator = chart_select["chart_generator"]
    chart_select["ui_update"]()
    rebuild_plot()
}

window.on_recompute_button = () => {
    rebuild_plot();
}

init()

// let sorted_data = {}
// let data
// let weights = {}
// weights["distortion"] = parseFloat(d3.select("#distortion input").property("value"))
// weights["fragmentation"] = parseFloat(d3.select("#fragmentation input").property("value"))
// weights["skewness"] = parseFloat(d3.select("#skewness input").property("value"))
// load_periodic_table_data().then( async (data_inc) => {
//     data = data_inc
//     let mappers = {}
//     for (let dimension of data.dimensions) {
//         let data_values = data.data.map(value => value[dimension])
//         data_values.sort(function (a, b) {
//             return a - b;
//         });
//         sorted_data[dimension] = data_values
//         let mapper = greedy_guided_split(data_values, weights, data_values)
//         // let mapper = new LinearMapper([[data_values[0], data_values[data_values.length - 1]]], [0, 1])
//         mappers[dimension] = mapper
//     }
//     let spc = new SPC(data.data, data.dimensions, mappers)
//     spc.draw()


    // create_par_coords(data, sorted_data, "#parCoordsDiv1", "simple")
    // create_par_coords(data, sorted_data, "#parCoordsDiv2", "split", single_linkage)
    // create_par_coords(data, sorted_data, "#parCoordsDiv2", "split_old")
    // create_par_coords(data, sorted_data, "#parCoordsDiv3", "split", complete_linkage)


// })

