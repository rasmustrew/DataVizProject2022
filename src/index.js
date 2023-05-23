import {get_selected_data, prepare_data_set} from "./ui/data_selection";
import {get_selected_dimensions, set_up_dimensions_selector} from "./ui/dimension_selection";
import {
    get_selected_step2_algorithm, step2_selection_map,
} from "./pipeline/step2";
import { get_selected_chart} from "./ui/chart_selection";
import {get_selected_step3_algorithm} from "./pipeline/step3";

import Beeswarm from "./plots/beeswarm";
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
        [ {
            step1: {algorithm_id: 'cost_reduction_threshold', args: 0.1},
            step2: {algorithm_id: 'none', args: null},
            step3: {algorithm_id: 'tight', args: null},
            name: "none"
        }, {
            step1: {algorithm_id: 'cost_reduction_threshold', args: 0.1},
            step2: {algorithm_id: 'optimal_guided_split', arg: null},
            step3: {algorithm_id: 'tight', args: null},
            "name": "opt"
        }


        ],
        [1, 8, 20])
    console.log(beeswarm_res)
}


// datasets: id list
// algorithms: {algorithm_id, args} list
// settings: bubble size list
async function run_beeswarm_benchmarks(datasets, pipelines, settings) {
    let benchmark_result = {}
    for (let dataset_id of datasets) {
        benchmark_result[dataset_id] = {}
        let dataset = await prepare_data_set(dataset_id)
        sorted_data = dataset.sorted_data
        for (let dimension of dataset.dimensions) {
            benchmark_result[dataset_id][dimension] = {}
            for (let pipeline of pipelines) {
                benchmark_result[dataset_id][dimension][pipeline.name] = {}
                let step1_algo = get_selected_step1_algorithm(pipeline.step1.algorithm_id)
                let step2_algo = get_selected_step2_algorithm(pipeline.step2.algorithm_id)
                let step3_algo = get_selected_step3_algorithm(pipeline.step3.algorithm_id)
                let mapper = run_step(dimension, step1_algo, pipeline.step1.args, step2_algo, pipeline.step2.args, step3_algo, pipeline.step3.args)
                for (let setting of settings) {
                    let beeswarm = new Beeswarm(chart_container_ref, dataset.data, dimension, mapper, setting)
                    benchmark_result[dataset_id][dimension][pipeline.name][setting] = beeswarm.runBenchmarks()
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
        mappers[dimension] = run_step(dimension, step1, step1_args, step2, step2_args, step3, step3_args)
    }
}

function run_step(dimension, step1, step1_args, step2, step2_args, step3, step3_args) {
    let splits = step2.algo(sorted_data[dimension], step2_args, (callback_info) => step1.algo(callback_info, step1_args))
    return step3.algo(sorted_data[dimension], splits, step3_args)
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
    select_chart();
}

window.select_data = async () => {
    await select_data();
    select_dimensions();
    select_chart();
}

window.on_recompute_button = () => {
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
