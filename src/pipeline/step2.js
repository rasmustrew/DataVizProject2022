import {
    greedy_interpolated_splits, guided_splits, optimal_guided_splits,
} from "../algorithms/guided_splits";
import {quantile_splits} from "../algorithms/quantile_splits";
import {kmeans_splits} from "../algorithms/kmeans_split";
import {NormalizingMapper} from "../mappings/linear_mapping";
import * as d3 from "d3";
import LogMapper from "../mappings/log_mapping";
import SqrtMapper from "../mappings/sqrt_mapping";
import PowMapper from "../mappings/pow_mapping";
import BoxCoxMapper from "../mappings/box_cox_mapping";
import UniformMapper from "../mappings/uniform_mapping";
import InterpolationMapper from "../mappings/interpolation_mapping";
import {data_range} from "../algorithms/util";
import {jenks} from "simple-statistics";

const step2_selector_ref = "#step2_algorithm_select";
let read_number_of_clusters = () => ({clusters: parseInt(d3.select("#clusters input").property("value"))})
let read_exponent = () => ({exponent: parseInt(d3.select("#exponent input").property("value"))})
let read_lambda = () => ({lambda: parseInt(d3.select("#lambda input").property("value"))})
let read_interpolation_slider = () => ({interpolation: parseInt(d3.select("#interpolation input").property("value")) / 100})

function read_skew_algo_args() {
    let weights = {}
    //weights["skewness"] = parseFloat(d3.select("#skewness_argument input").property("value"))
    weights["uniformity"] = parseInt(d3.select("#uniformity input").property("value")) / 100
    // weights["distortion"] = parseInt(d3.select("#distortion_argument input").property("value")) / 100
    weights["fragmentation"] = parseInt(d3.select("#fragmentation input").property("value")) / 100
    weights["clusters"] = parseInt(d3.select("#clusters input").property("value"))
    // weights["stopping_condition"] = d3.select("#stopping_condition select").property("value")
    return weights
}


//algo: (sorted_data, args, stopping_callback) - Not all will use the callback
export const step2_selection_map = {
    none: {
        algo: (sorted_data, args) => {
            return new NormalizingMapper(sorted_data)
        },
        arguments_id: [],
        read_args: () => {},
    },
    greedy_guided_split_2: {
        algo: greedy_interpolated_splits,
        arguments_id: ["#uniformity", "#fragmentation_argument"],
        read_args: read_skew_algo_args
    },
    optimal_guided_split: {
        algo: optimal_guided_splits,
        arguments_id: ["#fragmentation_argument"],
        read_args: read_skew_algo_args
    },

    quantile: {
        algo: quantile_splits,
        arguments_id: [],
        read_args: read_number_of_clusters
    },

    kmeans_opt: {
        algo: (sorted_data, args, stopping_callback) => kmeans_splits(sorted_data, args, "optimal", stopping_callback),
        arguments_id: [],
        // read_args: read_number_of_clusters
        read_args: () => {}
    },
    jenks: {
        algo: (sorted_data, args) => {
            let splits = jenks(sorted_data, args["clusters"] - 1)
            return splits
        },
        arguments_id: [],
        read_args: read_number_of_clusters
    },

    log: {
        algo: (sorted_data, args) => new LogMapper([data_range(sorted_data)], [0, 1]),
        arguments_id: [],
        read_args: () => {}
    },
    sqrt: {
        algo: (sorted_data, args) => new SqrtMapper([data_range(sorted_data)], [0, 1]),
        arguments_id: [],
        read_args: () => {}
    },
    pow: {
        algo: (sorted_data, args) => new PowMapper([data_range(sorted_data)], [0, 1], args.exponent),
        arguments_id: ["#exponent_argument"],
        read_args: read_exponent
    },
    box_cox: {
        algo: (sorted_data, args) => new BoxCoxMapper([data_range(sorted_data)], args.lambda),
        arguments_id: ["#lambda_argument"],
        read_args: read_lambda
    },
    uniform: {
        algo: (sorted_data, args) => new InterpolationMapper(new NormalizingMapper(sorted_data), new UniformMapper(sorted_data), args.uniformity),
        arguments_id: ["#uniformity"],
        read_args: read_skew_algo_args
    }
    // greedy_guided_split: {
    //     algo: greedy_guided_split,
    //     arguments_id: ["#uniformity", "#distortion_argument", "#fragmentation_argument"],
    //     read_args: read_skew_algo_args
    // },
    // osaragi: {
    //     algo: (sorted_data, args) => {
    //         const splitter = new OsaragiSplit()
    //         return splitter.MIL_splits(sorted_data, args)
    //     },
    //     arguments_id: [],
    //     read_args: read_number_of_clusters
    // },
    // kmeans: {
    //     algo: (sorted_data, args) => kmeans_splits(sorted_data, args, "random"),
    //     arguments_id: [],
    //     read_args: read_number_of_clusters
    // },
    // kmeans_plusplus: {
    //     algo: (sorted_data, args) => kmeans_splits(sorted_data, args, "++"),
    //     arguments_id: [],
    //     read_args: read_number_of_clusters
    // },
    // guided_splits: {
    //     algo: guided_splits,
    //     arguments_id: ["#uniformity", "#fragmentation_argument"],
    //     read_args: read_skew_algo_args
    // },
    // hardcoded_periodic_table: {
    //     algo: hardcoded_periodic_table_get_mapper,
    //     arguments_id: [],
    //     read_args: () => {},
    // },
}



export function get_selected_step2_algorithm() {
    return step2_selection_map[d3.select(step2_selector_ref).property("value")]
}

export function update_cluster_amount(k) {
    let cluster_input = document.querySelector("#clusters input")
    cluster_input.value = k
}