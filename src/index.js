import * as d3 from "d3";
import SPC from "./plots/spc";
import {greedy_guided_split, read_greedy_guided_split_args} from "./algorithms/greedy_guided_split/greedy_guided_split"
import { load_periodic_table_data } from "./data/load_periodic_table_data";
import {load_un_data} from "./data/load_un_data";
import {hardcoded_periodic_table_get_mapper} from "./algorithms/hardcoded_splits";
import HeatMap from "./plots/heatmap";
import Choropleth from "./plots/choropleth";
import {quantile_splits} from "./algorithms/quantile_splits";
import {kmeans_splits} from "./algorithms/kmeans_split";

console.log("starting")

const chart_container_ref = "#plot_container_id"

let data_selection_map = {
    periodic_table: load_periodic_table_data,
    un_country_data: load_un_data,
}

let read_number_of_clusters = () => {
    let args = {}
    args["clusters"] = parseInt(d3.select("#clusters input").property("value"))
    return args
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
    }
}

window.select_algorithm = (selection) => {
    console.log("selected algo: ", selection)
    let {arguments_id} = algorithm_selection_map[selection];
    let args = d3.select("#arguments_div").selectChildren();
    args.style("display", "none")
    if (arguments_id !== null) {
        d3.select(arguments_id).style("display", null)
    }

    window.rebuild_plot()
}


let chart_selection_map = {
    spc: (data, dimensions, mappers) => {
        let spc = new SPC(chart_container_ref, data, dimensions, mappers)
        spc.draw()
    },
    heatmap: (data, dimensions, mappers) => new HeatMap(chart_container_ref, data, dimensions, mappers)
}

let chart_generator = chart_selection_map["spc"];

window.select_chart = (selection) => {
    console.log("selected chart: ", selection)
    chart_generator = chart_selection_map[selection]
    create_plot()
}


window.rebuild_plot = () => {
    clean_plot();
    create_plot();
}


function clean_plot() {
    d3.select(chart_container_ref).html("")
}

async function create_plot() {
    let data_selection = d3.select("#data-select").property("value")
    let data_function = data_selection_map[data_selection]
    let {data, dimensions} = await data_function();


    let algo_selection = d3.select("#algorithm-select").property("value")
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

    chart_generator(data, dimensions, mappers)
}

function init() {
    let algo_selection = d3.select("#algorithm-select").property("value")
    window.select_algorithm(algo_selection)
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

