import {get_selected_data, prepare_data_set} from "./ui/data_selection";
import {get_selected_dimensions, set_up_dimensions_selector} from "./ui/dimension_selection";
import {
    get_selected_step2_algorithm, step2_selection_map,
} from "./pipeline/step2";
import { get_selected_chart} from "./ui/chart_selection";
import {get_selected_step4_algorithm, step4_selection_map} from "./pipeline/step4";

import Beeswarm from "./plots/beeswarm";
import LinearMapper from "./mappings/linear_mapping";
import CompositeMapper from "./mappings/composite_mapping";
import {
    distortion,
    line_crossings, overplotting_1d,
    overplotting_2d,
    screen_histogram_1d,
    screen_histogram_2d
} from "./benchmarks/benchmarks";
import * as d3 from "d3";
import {get_selected_step1_algorithm, step1_selection_map} from "./pipeline/step1";
import ScatterPlot from "./plots/scatterplot";
import SPC from "./plots/spc";
import {read_gap_size, read_step_5} from "./pipeline/step5";
import ScreenMapper from "./mappings/screen_mapping";
import {get_selected_step3_algorithm, step3_selection_map} from "./pipeline/step3";
import PiecewiseLinearMapper from "./mappings/proportionate_split_mapping";

console.log("starting")

const chart_container_ref = "#plot_container_id";
let data, dimensions, sorted_data, selected_dimensions, mappers, selected_chart_generator

async function run_benchmarks() {
//     let ours_vs_linear_pipeline = [
//             {
//                 step1: {algorithm_id: 'cost_reduction_threshold', args: 0.1},
//                 step2: {algorithm_id: 'none', args: null},
//                 step3: {algorithm_id: 'equal', args: null},
//                 step4: {algorithm_id: 'tight', args: null},
//                 step5: {gap_size: 30},
//                 name: "none"
//             }, {
//         // {
//             step1: {algorithm_id: 'cost_reduction_threshold', args: 0.1},
//             step2: {algorithm_id: 'optimal_guided_split', arg: null},
//             step3: {algorithm_id: 'unique', args: null},
//             step4: {algorithm_id: 'tight', args: null},
//             step5: {gap_size: 30},
//             "name": "opt"
//         }
//     ]
//     let distortion_res = await run_distortion_benchmarks(["periodic_table"], ours_vs_linear_pipeline)
//     let beeswarm_res = await run_beeswarm_benchmarks(["periodic_table"], ours_vs_linear_pipeline,
// [
//             { bubble_size: 1, name: 1},
//             { bubble_size: 8, name: 8},
//             { bubble_size: 20, name: 20}
//         ])
//
//     let scatterplot_res = await run_scatterplot_benchmarks(["periodic_table"],ours_vs_linear_pipeline)
//     let parcoords_res = await run_parcoords_benchmarks(["periodic_table"], ours_vs_linear_pipeline)
//
//     console.log("OURS VS LINEAR")
//     console.log(distortion_res)
//     console.log(beeswarm_res)
//     console.log(scatterplot_res)
//     console.log(parcoords_res)

    console.log("OURS VS QUANTILE AND JENKS")

    let pipelines_vs = [{
        step1: {algorithm_id: 'custom_choice_k', args: 1},
        step2: {algorithm_id: 'quantile', args: {clusters: 1}},
        step3: {algorithm_id: 'unique', args: null},
        step4: {algorithm_id: 'tight', args: null},
        step5: {gap_size: 30},
        name: "quantile-0"
    }, {
        step1: {algorithm_id: 'custom_choice_k', args: 0},
        step2: {algorithm_id: 'jenks', args: {clusters: 0}},
        step3: {algorithm_id: 'unique', args: null},
        step4: {algorithm_id: 'tight', args: null},
        step5: {gap_size: 30},
        name: "jenks-0"
    }, {
        step1: {algorithm_id: 'custom_choice_k', args: 1},
        step2: {algorithm_id: 'optimal_guided_split', args: null},
        step3: {algorithm_id: 'unique', args: null},
        step4: {algorithm_id: 'tight', args: null},
        step5: {gap_size: 30},
        "name": "opt-0"
    },
        {
            step1: {algorithm_id: 'custom_choice_k', args: 2},
            step2: {algorithm_id: 'quantile', args: {clusters: 2}},
            step3: {algorithm_id: 'unique', args: null},
            step4: {algorithm_id: 'tight', args: null},
            step5: {gap_size: 30},
            name: "quantile-1"
        }, {
            step1: {algorithm_id: 'custom_choice_k', args: 1},
            step2: {algorithm_id: 'jenks', args: {clusters: 1}},
            step3: {algorithm_id: 'unique', args: null},
            step4: {algorithm_id: 'tight', args: null},
            step5: {gap_size: 30},
            name: "jenks-1"
        }, {
            step1: {algorithm_id: 'custom_choice_k', args: 2},
            step2: {algorithm_id: 'optimal_guided_split', args: null},
            step3: {algorithm_id: 'unique', args: null},
            step4: {algorithm_id: 'tight', args: null},
            step5: {gap_size: 30},
            "name": "opt-1"
        },
        {
            step1: {algorithm_id: 'custom_choice_k', args: 3},
            step2: {algorithm_id: 'quantile', args: {clusters: 3}},
            step3: {algorithm_id: 'unique', args: null},
            step4: {algorithm_id: 'tight', args: null},
            step5: {gap_size: 30},
            name: "quantile-2"
        }, {
            step1: {algorithm_id: 'custom_choice_k', args: 2},
            step2: {algorithm_id: 'jenks', args: {clusters: 2}},
            step3: {algorithm_id: 'unique', args: null},
            step4: {algorithm_id: 'tight', args: null},
            step5: {gap_size: 30},
            name: "jenks-2"
        }, {
            step1: {algorithm_id: 'custom_choice_k', args: 3},
            step2: {algorithm_id: 'optimal_guided_split', args: null},
            step3: {algorithm_id: 'unique', args: null},
            step4: {algorithm_id: 'tight', args: null},
            step5: {gap_size: 30},
            "name": "opt-2"
        },
        {
            step1: {algorithm_id: 'custom_choice_k', args: 4},
            step2: {algorithm_id: 'quantile', args: {clusters: 4}},
            step3: {algorithm_id: 'unique', args: null},
            step4: {algorithm_id: 'tight', args: null},
            step5: {gap_size: 30},
            name: "quantile-3"
        }, {
            step1: {algorithm_id: 'custom_choice_k', args: 3},
            step2: {algorithm_id: 'jenks', args: {clusters: 3}},
            step3: {algorithm_id: 'unique', args: null},
            step4: {algorithm_id: 'tight', args: null},
            step5: {gap_size: 30},
            name: "jenks-3"
        }, {
            step1: {algorithm_id: 'custom_choice_k', args: 4},
            step2: {algorithm_id: 'optimal_guided_split', args: null},
            step3: {algorithm_id: 'unique', args: null},
            step4: {algorithm_id: 'tight', args: null},
            step5: {gap_size: 30},
            "name": "opt-3"
        },
        {
            step1: {algorithm_id: 'custom_choice_k', args: 5},
            step2: {algorithm_id: 'quantile', args: {clusters: 5}},
            step3: {algorithm_id: 'unique', args: null},
            step4: {algorithm_id: 'tight', args: null},
            step5: {gap_size: 30},
            name: "quantile-4"
        }, {
            step1: {algorithm_id: 'custom_choice_k', args: 4},
            step2: {algorithm_id: 'jenks', args: {clusters: 4}},
            step3: {algorithm_id: 'unique', args: null},
            step4: {algorithm_id: 'tight', args: null},
            step5: {gap_size: 30},
            name: "jenks-4"
        }, {
            step1: {algorithm_id: 'custom_choice_k', args: 5},
            step2: {algorithm_id: 'optimal_guided_split', args: null},
            step3: {algorithm_id: 'unique', args: null},
            step4: {algorithm_id: 'tight', args: null},
            step5: {gap_size: 30},
            "name": "opt-4"
        }
    ]

    let beeswarm_competition_res = await run_beeswarm_benchmarks(["periodic_table"], pipelines_vs,
        [
            { bubble_size: 1, name: 1},
            { bubble_size: 8, name: 8},
            { bubble_size: 20, name: 20}
        ])

    console.log(beeswarm_competition_res)
    // let distortion_res = await run_distortion_benchmarks(["periodic_table"], pipelines_vs)
    // console.log(distortion_res)

    let par_coords_competitive_res = await run_parcoords_benchmarks(["periodic_table"], pipelines_vs)
    // let scatterplot_competitive_res = await run_scatterplot_benchmarks(["un_country_data"], pipelines_vs)

    console.log(par_coords_competitive_res)
    // console.log(scatterplot_competitive_res)
}


// datasets: id list
// algorithms: {algorithm_id, args} list
// settings: bubble size list
async function run_beeswarm_benchmarks(datasets, pipelines, settings) {
    let benchmark_result = {statistics: {}}
    for (let dataset_id of datasets) {
        benchmark_result[dataset_id] = {}
        let dataset = await prepare_data_set(dataset_id)
        benchmark_result.statistics["data_length"] = dataset.data.length
        // console.log(dataset_id, dataset)
        sorted_data = dataset.sorted_data
        for (let dimension of dataset.dimensions) {
            benchmark_result[dataset_id][dimension] = {}
            for (let pipeline of pipelines) {
                benchmark_result[dataset_id][dimension][pipeline.name] = {}
                let step1_algo = step1_selection_map[pipeline.step1.algorithm_id]
                let step2_algo = step2_selection_map[pipeline.step2.algorithm_id]
                let step3_algo = step3_selection_map[pipeline.step3.algorithm_id]
                let step4_algo = step4_selection_map[pipeline.step4.algorithm_id]
                let mapper = run_pipeline(dimension, step1_algo, pipeline.step1.args, step2_algo, pipeline.step2.args, step3_algo, pipeline.step3.args, step4_algo, pipeline.step4.args)
                for (let setting of settings) {
                    let beeswarm = new Beeswarm(chart_container_ref, dataset.data, dimension, mapper, setting.bubble_size, pipeline.step5)
                    benchmark_result["statistics"]["output_ranges"] = beeswarm.mapper.get_output_space_ranges()
                    benchmark_result[dataset_id][dimension][pipeline.name][setting.name] = beeswarm.runBenchmarks()
                    beeswarm.delete()
                }
            }
        }
    }
    return benchmark_result
}

async function run_distortion_benchmarks(datasets, pipelines) {
    let benchmark_result = {}
    for (let dataset_id of datasets) {
        benchmark_result[dataset_id] = {}
        let dataset = await prepare_data_set(dataset_id)
        sorted_data = dataset.sorted_data
        for (let dimension of dataset.dimensions) {
            benchmark_result[dataset_id][dimension] = {}
            for (let pipeline of pipelines) {
                benchmark_result[dataset_id][dimension][pipeline.name] = {}
                let step1_algo = step1_selection_map[pipeline.step1.algorithm_id]
                let step2_algo = step2_selection_map[pipeline.step2.algorithm_id]
                let step3_algo = step3_selection_map[pipeline.step3.algorithm_id]
                let step4_algo = step4_selection_map[pipeline.step4.algorithm_id]
                let raw_mapper = run_pipeline(dimension, step1_algo, pipeline.step1.args, step2_algo, pipeline.step2.args, step3_algo, pipeline.step3.args, step4_algo, pipeline.step4.args)
                //use beeswarm to get a mapper with gaps, bubble size does not matter for distortion
                let beeswarm = new Beeswarm(chart_container_ref, dataset.data, dimension, raw_mapper, 8, pipeline.step5)
                let linear_mapper = new LinearMapper(beeswarm.mapper.get_output_space_ranges(), [0, 1])
                let comp_mapper = new CompositeMapper([beeswarm.mapper, linear_mapper])
                benchmark_result[dataset_id][dimension][pipeline.name] = distortion(dataset.data_per_dimension[dimension], comp_mapper )
                beeswarm.delete()
            }
        }
    }
    return benchmark_result
}

async function run_scatterplot_benchmarks(datasets, pipelines) {
    let benchmark_result = {
        statistics: {}
    }

    for (let dataset_id of datasets) {
        benchmark_result[dataset_id] = {}
        let dataset = await prepare_data_set(dataset_id)
        sorted_data = dataset.sorted_data
        for (let dimension_a of dataset.dimensions) {
            benchmark_result[dataset_id][dimension_a] = {}
            for (let dimension_b of dataset.dimensions) {
                if (dimension_a === dimension_b) {
                    continue
                }
                benchmark_result[dataset_id][dimension_a][dimension_b] = {}
                // let dimensions_label = dimension_a + ' + ' + dimension_b

                for (let pipeline of pipelines) {
                    let step1_algo = step1_selection_map[pipeline.step1.algorithm_id]
                    let step2_algo = step2_selection_map[pipeline.step2.algorithm_id]
                    let step3_algo = step3_selection_map[pipeline.step3.algorithm_id]
                    let step4_algo = step4_selection_map[pipeline.step4.algorithm_id]
                    let raw_mappers = {}
                    raw_mappers[dimension_a] = run_pipeline(dimension_a, step1_algo, pipeline.step1.args, step2_algo, pipeline.step2.args, step3_algo, pipeline.step3.args, step4_algo, pipeline.step4.args)
                    raw_mappers[dimension_b] = run_pipeline(dimension_b, step1_algo, pipeline.step1.args, step2_algo, pipeline.step2.args, step3_algo, pipeline.step3.args, step4_algo, pipeline.step4.args)
                    let data_a = dataset.data_per_dimension[dimension_a]
                    let data_b = dataset.data_per_dimension[dimension_b]

                    let scatterplot = new ScatterPlot(chart_container_ref, dataset.data, [dimension_a, dimension_b], raw_mappers, pipeline.step5)

                    let screen_mapper_a = scatterplot.x_mapper
                    let linear_mapper_a = new LinearMapper(screen_mapper_a.get_output_space_ranges(), [0, 1])
                    let comp_mapper_a = new CompositeMapper([screen_mapper_a, linear_mapper_a])

                    let screen_mapper_b = scatterplot.y_mapper
                    let linear_mapper_b = new LinearMapper(screen_mapper_b.get_output_space_ranges(), [0, 1])
                    let comp_mapper_b = new CompositeMapper([screen_mapper_b, linear_mapper_b])

                    let output_ranges_x = scatterplot.x_mapper.get_output_space_ranges()
                    let output_ranges_y = scatterplot.y_mapper.get_output_space_ranges()
                    let width = output_ranges_x[output_ranges_x.length - 1][1]
                    let height = output_ranges_y[0][0]
                    let point_size = scatterplot.point_size
                    // let num_bins_a = Math.floor(width / point_size)
                    // let num_bins_b = Math.floor(height / point_size)
                    let num_bins_a = Math.floor(width / point_size)
                    let num_bins_b = Math.floor(height / point_size)
                    benchmark_result["statistics"]["width"] = width
                    benchmark_result["statistics"]["height"] = height
                    benchmark_result["statistics"]["point_size"] = point_size
                    benchmark_result["statistics"]["num_bins_x"] = num_bins_a
                    benchmark_result["statistics"]["num_bins_y"] = num_bins_b

                    let histogram_2d = screen_histogram_2d(data_a, data_b, comp_mapper_a, comp_mapper_b, num_bins_a, num_bins_b)
                    let overplotting = overplotting_2d(histogram_2d)
                    benchmark_result[dataset_id][dimension_a][dimension_b][pipeline.name] = overplotting
                    scatterplot.delete()

                }
            }
        }
    }
    return benchmark_result
}

async function run_parcoords_benchmarks(datasets, pipelines) {
    let benchmark_result = {
        statistics: {
        }
    }
    for (let dataset_id of datasets) {
        benchmark_result[dataset_id] = {}
        let dataset = await prepare_data_set(dataset_id)
        sorted_data = dataset.sorted_data
        for (let pipeline of pipelines) {
            // benchmark_result[dataset_id][dimension_a][dimension_b][pipeline.name] = {}
            let step1_algo = step1_selection_map[pipeline.step1.algorithm_id]
            let step2_algo = step2_selection_map[pipeline.step2.algorithm_id]
            let step3_algo = step3_selection_map[pipeline.step3.algorithm_id]
            let step4_algo = step4_selection_map[pipeline.step4.algorithm_id]
            let raw_mappers = {}
            dataset.dimensions.forEach((dim) => raw_mappers[dim] = run_pipeline(dim, step1_algo, pipeline.step1.args, step2_algo, pipeline.step2.args, step3_algo, pipeline.step3.args, step4_algo, pipeline.step4.args))

            // console.log(raw_mappers)
            let parcoords = new SPC(chart_container_ref, dataset.data, dataset.dimensions, raw_mappers, pipeline.step5)
            let width = parcoords.width / (dataset.dimensions.length - 1)
            let line_size = 2

            for (let dimension_a of dataset.dimensions) {
                let data_a = dataset.data_per_dimension[dimension_a]
                let screen_mapper_a = parcoords.mappers[dimension_a]
                let linear_mapper_a = new LinearMapper(screen_mapper_a.get_output_space_ranges(), [0, 1])
                let comp_mapper_a = new CompositeMapper([screen_mapper_a, linear_mapper_a])

                let output_ranges = screen_mapper_a.get_output_space_ranges()
                let height = output_ranges[0][0]
                let num_bins = Math.floor(height / line_size)
                benchmark_result.statistics['height'] = height
                benchmark_result.statistics['width'] = width
                benchmark_result.statistics['line_size'] = line_size
                benchmark_result.statistics['num_bins'] = num_bins

                benchmark_result[dataset_id][dimension_a] = benchmark_result[dataset_id][dimension_a] || {}
                benchmark_result[dataset_id][dimension_a]["overplotting"] = benchmark_result[dataset_id][dimension_a]["overplotting"] || {}

                // 1d overplotting
                let histogram_1d = screen_histogram_1d(data_a, comp_mapper_a, num_bins)
                let overplotting = overplotting_1d(histogram_1d)
                benchmark_result[dataset_id][dimension_a]["overplotting"][pipeline.name] = overplotting

                // Distortion
                let distort = distortion(data_a, comp_mapper_a)
                benchmark_result[dataset_id][dimension_a]["distortion"] = benchmark_result[dataset_id][dimension_a]["distortion"] || {}
                benchmark_result[dataset_id][dimension_a]["distortion"][pipeline.name] = distort

                for (let dimension_b of dataset.dimensions) {
                    if (dimension_a === dimension_b) {
                        continue
                    }
                    benchmark_result[dataset_id][dimension_a][dimension_b] = benchmark_result[dataset_id][dimension_a][dimension_b] || {
                        avg_crossing_angle: {},
                        overplotting: {},
                    }

                    let data_b = dataset.data_per_dimension[dimension_b]
                    let screen_mapper_b = parcoords.mappers[dimension_b]
                    let linear_mapper_b = new LinearMapper(screen_mapper_b.get_output_space_ranges(), [0, 1])
                    let comp_mapper_b = new CompositeMapper([screen_mapper_b, linear_mapper_b])

                    // 2d overplotting

                    // console.log(screen_mapper_a.get_output_space_ranges())
                    // console.log(comp_mapper_a, comp_mapper_b)
                    let histogram_2d = screen_histogram_2d(data_a, data_b, comp_mapper_a, comp_mapper_b, num_bins, num_bins)
                    let overplotting2d = overplotting_2d(histogram_2d)
                    benchmark_result[dataset_id][dimension_a][dimension_b]["overplotting"][pipeline.name] = overplotting2d

                    // crossing angles
                    let x_to_y_ratio = width / height
                    let res = line_crossings(data_a, data_b, comp_mapper_a, comp_mapper_b, x_to_y_ratio)
                    benchmark_result[dataset_id][dimension_a][dimension_b]["avg_crossing_angle"][pipeline.name] = res.avg_crossing_angle.toFixed(2)

                    //delete
                    parcoords.delete()
                }
            }
        }
    }
    return benchmark_result
}

function select_chart() {
    document.querySelector(chart_container_ref).innerHTML = ""
    selected_chart_generator = get_selected_chart()
    let step5_settings = read_step_5()
    selected_chart_generator(chart_container_ref, data, selected_dimensions, mappers, step5_settings)
}


function select_steps() {
    let step1 = get_selected_step1_algorithm()
    let step2 = get_selected_step2_algorithm()
    let step3 = get_selected_step3_algorithm()
    let step4 = get_selected_step4_algorithm()
    let arguments_id = [...step1.arguments_id, ...step2.arguments_id, ...step3.arguments_id, ...step4.arguments_id]
    step_selection_update(arguments_id)

    let step1_args = step1.read_args();
    let step2_args = step2.read_args();
    let step3_args = step3.read_args();
    let step4_args = step4.read_args();

    mappers = {}
    for (let dimension of selected_dimensions) {
        mappers[dimension] = run_pipeline(dimension, step1, step1_args, step2, step2_args, step3, step3_args, step4, step4_args)
    }
}

function run_pipeline(dimension, step1, step1_args, step2, step2_args, step3, step3_args, step4, step4_args) {
    // console.log(step1, step2, step3, step4)
    // console.log(dimension)
    // console.log(sorted_data)
    let splits_or_mapper = step2.algo(sorted_data[dimension], step2_args, (callback_info) => step1.algo(callback_info, step1_args))
    if (splits_or_mapper instanceof Array) {
        let output_ranges = step3.algo(sorted_data[dimension], splits_or_mapper, step3_args)
        let final_input_ranges = step4.algo(sorted_data[dimension], splits_or_mapper, output_ranges, step4_args)
        return new PiecewiseLinearMapper(final_input_ranges, output_ranges)
    }
    else return splits_or_mapper
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
    select_steps();
    select_chart();
}

window.select_data = async () => {
    await select_data();
    select_dimensions();
    select_steps();
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
