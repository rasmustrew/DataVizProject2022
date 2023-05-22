import {data_selection_map, get_selected_data, prepare_data_set} from "./ui/data_selection";
import {get_selected_dimensions, set_up_dimensions_selector} from "./ui/dimension_selection";
import {
    step2_selection_map,
    algorithm_selection_update,
    get_selected_step2_algorithm,
    update_cluster_amount
} from "./pipeline/step2";
import {get_chart_selection, get_selected_chart} from "./ui/chart_selection";
import {update_metrics_display} from "./ui/metric_display";
import {get_range_function, get_selected_step3_algorithm} from "./pipeline/step3";
import Beeswarm from "./plots/beeswarm";
import {load_periodic_table_data} from "./data/load_periodic_table_data";
import LinearMapper from "./mappings/linear_mapping";
import CompositeMapper from "./mappings/composite_mapping";
import {overplotting_2d, screen_histogram_2d} from "./benchmarks/benchmarks";
import * as d3 from "d3";
import {get_selected_step1_algorithm} from "./pipeline/step1";

console.log("starting")

const chart_container_ref = "#plot_container_id";
let data, dimensions, sorted_data, selected_dimensions, mappers, selected_chart_generator

async function run_benchmarks() {
    let beeswarm_res = await run_beeswarm_benchmarks(
        ["periodic_table"],
        [
            {algorithm_id: 'none', args: null},
            {algorithm_id: 'optimal_guided_split', arg: null}
        ],
        [1, 8, 20])
    console.log(beeswarm_res)
}


// datasets: id list
// algorithms: {algorithm_id, args} list
// settings: bubble size list
async function run_beeswarm_benchmarks(datasets, algorithms, settings) {
    let benchmark_result = {}
    for (let dataset_id of datasets) {
        benchmark_result[dataset_id] = {}
        let dataset = await prepare_data_set(dataset_id)
        for (let dimension of dataset.dimensions) {
            benchmark_result[dataset_id][dimension] = {}
            for (let {algorithm_id, args} of algorithms) {
                benchmark_result[dataset_id][dimension][algorithm_id] = {}
                let { algo } = step2_selection_map[algorithm_id]
                let mapper = algo(dataset.sorted_data[dimension], args)
                for (let setting of settings) {
                    let beeswarm = new Beeswarm(chart_container_ref, dataset.data, dimension, mapper, setting)
                    benchmark_result[dataset_id][dimension][algorithm_id][setting] = beeswarm.runBenchmarks()
                    beeswarm.delete()
                }
            }
        }
    }
    return benchmark_result
}

async function run_scatterplot_benchmarks(datasets, algorithms, settings) {
    let benchmark_result = {}
    for (let dataset_id of datasets) {
        benchmark_result[dataset_id] = {}
        let dataset = await prepare_data_set(dataset_id)
        for (let i = 0; i < dataset.dimensions.length - 1; i++) {
            let dimension_a = dimensions[i]
            let dimension_b = dimensions[i+1]
            let dimensions_label = dimension_a + ' + ' + dimension_b
            benchmark_result[dataset_id][dimensions_label] = {}
            for (let {algorithm_id, args} of algorithms) {
                benchmark_result[dataset_id][dimensions_label][algorithm_id] = {}
                let { algo } = step2_selection_map[algorithm_id]
                let raw_mapper_a = algo(dataset.sorted_data[dimension_a], args)
                let raw_mapper_b = algo(dataset.sorted_data[dimension_b], args)
                let data_a = dataset.sorted_data[dimension_a]
                let data_b = dataset.sorted_data[dimension_b]
                let linear_mapper_a = new LinearMapper(this.mappers[dim_a].get_output_space_ranges(), [0, 1])
                let comp_mapper_a = new CompositeMapper([this.mappers[dim_a], linear_mapper_a])
                let linear_mapper_b = new LinearMapper(this.mappers[dim_b].get_output_space_ranges(), [0, 1])
                let comp_mapper_b = new CompositeMapper([this.mappers[dim_b], linear_mapper_b])
                let histogram_2d = screen_histogram_2d(data_a, data_b, comp_mapper_a, comp_mapper_b, 100)
                let overplotting = overplotting_2d(histogram_2d)
                for (let setting of settings) {
                    benchmark_result[dataset_id][dimensions_label][algorithm_id][setting] = beeswarm.runBenchmarks()
                    beeswarm.delete()
                }
            }


        }
    }
    return benchmark_result
}

function select_chart() {
    document.querySelector(chart_container_ref).innerHTML = ""
    selected_chart_generator = get_selected_chart()
    selected_chart_generator(chart_container_ref, data, selected_dimensions, mappers)
}

function select_algorithm() {
    let {algo, arguments_id, read_args} = get_selected_step2_algorithm()
    let range_algo = get_range_function()
    // algorithm_selection_update(arguments_id)
    let args = read_args()
    mappers = {}
    for (let dimension of selected_dimensions) {
        let algo_out = algo(sorted_data[dimension], args)
        mappers[dimension] = algo_out

    }
    let dimension = selected_dimensions[0]
    // update_metrics_display(sorted_data[dimension], mappers[dimension])
    // if (args != null && "auto_k" in args && !args["auto_k"]) {
    //     update_cluster_amount(mappers[dimension].get_output_space_ranges().length)
    // }
}

function select_steps() {
    let step1 = get_selected_step1_algorithm()
    let step2 = get_selected_step2_algorithm()
    let step3 = get_selected_step3_algorithm()
    let arguments_id = [...step1.arguments_id, ...step2.arguments_id, ...step3.arguments_id]
    step_selection_update(arguments_id)

    let step1_args = step1.read_args();
    let step2_args = step2.read_args();
    let step3_args = step3.read_args();

    mappers = {}
    for (let dimension of selected_dimensions) {
        let splits = step2.algo(sorted_data[dimension], step2_args, (callback_info) => step1.algo(callback_info, step1_args))
        console.log(splits)
        mappers[dimension] = step3.algo(sorted_data[dimension], splits, step3_args)
        console.log(mappers)
    }

}

export function step_selection_update(arguments_id) {
    let args = d3.selectAll(".argument_input");
    args.style("display", "none")
    if (arguments_id !== null) {
        for (const argument_id of arguments_id) {
            d3.select(argument_id).style("display", null)
        }
    }
}

function select_dimensions() {
    selected_dimensions = get_selected_dimensions()
}

async function select_data() {
    let selected_data = await get_selected_data()
    data = selected_data.data
    dimensions = selected_data.dimensions
    sorted_data = selected_data.sorted_data

    set_up_dimensions_selector(dimensions)
}

window.select_chart = () => {
    select_chart()
}

window.select_step = () => {
    select_steps();
    select_chart();
}

window.select_dimensions = () => {
    select_dimensions();
    // select_algorithm();
    select_chart();
}

window.select_data = async () => {
    await select_data();
    select_dimensions();
    // select_algorithm();
    select_chart();
}

window.on_recompute_button = () => {
    // select_algorithm();
    select_steps();
    select_chart();
}


async function init() {
    await select_data();
    select_dimensions();
    select_steps();
    // select_algorithm()
    select_chart();
}

// run_benchmarks().then(() => console.log("done"))
init()
// let my_data = [
//     8e-9,
//     1e-8,
//     1e-8,
//     2e-8,
//     2e-8,
//     3e-8,
//     4e-8,
//     4e-8,
//     5e-8,
//     5e-8,
//     5e-8,
//     5e-8,
//     5e-8,
//     6e-8,
//     6e-8,
//     6e-8,
//     7e-8,
//     7e-8,
//     8e-8,
//     1e-7,
//     1e-7,
//     1e-7,
//     1e-7,
//     2e-7,
//     2e-7,
//     2e-7,
//     2e-7,
//     2e-7,
//     2e-7,
//     2e-7,
//     2e-7,
//     2e-7,
//     2e-7,
//     3e-7,
//     4e-7,
//     4e-7,
//     5e-7,
//     5e-7,
//     5e-7,
//     6e-7,
//     7e-7,
//     7e-7,
//     8e-7,
//     9e-7,
//     0.000001,
//     0.000001,
//     0.000001,
//     0.000001,
//     0.000001,
//     0.000001,
//     0.000001,
//     0.000003,
//     0.000003,
//     0.000004,
//     0.000004,
//     0.000005,
//     0.000006,
//     0.00002,
//     0.00003,
//     0.00004,
//     0.0001,
//     0.0001,
//     0.0003,
//     0.0003,
//     0.0003,
//     0.0007,
//     0.0008,
//     0.0015,
//     0.002,
//     0.005,
//     0.006,
//     0.007,
//     0.02,
//     0.05,
//     0.06,
//     0.07,
//     0.1,
//     0.11,
//     0.13,
//     0.5,
//     1,
//     23,
//     75
// ]
// let mapper = hardcoded_periodic_table_get_mapper(my_data, {}, "abundance/universe")
// let mapperToSameRange = new LinearMapper(mapper.get_output_space_ranges(), [8e-9, 75])
// let combined_mapper = new CompositeMapper([mapper, mapperToSameRange])
// let transformed_data = my_data.map((data_point) => combined_mapper.map(data_point))
//
// let split_points = [8e-9, 0.0009273414413707938, 0.13437282585692462, 1.2912620979636045, 75]
// let transformed_split_points = split_points.map((data_point) => combined_mapper.map(data_point))
// console.log(transformed_data)
// console.log(transformed_split_points)
//
//
//
//
// let ggs_mapper = greedy_guided_split(my_data, {distortion: 1, fragmentation: 0.04, skewness: 2}, 'abundance/universe')
// console.log(ggs_mapper.get_input_space_ranges())
// let ggs_split_points = [
//     8e-9,
//     4e-7,
//     0.0015,
//     75
// ]
//
// let ggs_mapper_to_same_range = new LinearMapper(ggs_mapper.get_output_space_ranges(), [8e-9, 75])
// let ggs_combined_mapper = new CompositeMapper([ggs_mapper, ggs_mapper_to_same_range])
//
// let transformed_ggs_split_points = ggs_split_points.map((data_point) => ggs_combined_mapper.map(data_point))
// let transformed_ggs_data = my_data.map((data_point) => ggs_combined_mapper.map(data_point))
// console.log(transformed_ggs_split_points)
// console.log(transformed_ggs_data)
