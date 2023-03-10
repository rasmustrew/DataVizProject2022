import {
    greedy_guided_split,
    read_greedy_guided_split_args
} from "../algorithms/greedy_guided_split/greedy_guided_split";
import {hardcoded_periodic_table_get_mapper} from "../algorithms/hardcoded_splits";
import {quantile_splits} from "../algorithms/quantile_splits";
import {kmeans_splits} from "../algorithms/kmeans_split";
import LinearMapper from "../mappings/linear_mapping";
import * as d3 from "d3";
import LogMapper from "../mappings/log_mapping";
import SqrtMapper from "../mappings/sqrt_mapping";
import PowMapper from "../mappings/pow_mapping";
import BoxCoxMapper from "../mappings/box_cox_mapping";
import {MIL_splits} from "../algorithms/surprise_split";
import UniformMapper from "../mappings/uniform_mapping";

const algo_selector_ref = "#algorithm-select";
let read_number_of_clusters = () => ({clusters: parseInt(d3.select("#clusters input").property("value"))})
let read_exponent = () => ({exponent: parseInt(d3.select("#exponent input").property("value"))})
let read_lambda = () => ({lambda: parseInt(d3.select("#lambda input").property("value"))})

let algorithm_selection_map = {
    none: {
        algo: (sorted_data, args, dimension) => {
            return new LinearMapper([[sorted_data[0], sorted_data[sorted_data.length - 1]]], [0, 1])
        },
        arguments_id: null,
        read_args: () => {},
    },
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
        arguments_id: "#num_clusters_argument",
        read_args: read_number_of_clusters
    },
    kmeans: {
        algo: (sorted_data, args, dimension) => kmeans_splits(sorted_data, args, dimension, "random"),
        arguments_id: "#num_clusters_argument",
        read_args: read_number_of_clusters
    },
    kmeans_plusplus: {
        algo: (sorted_data, args, dimension) => kmeans_splits(sorted_data, args, dimension, "++"),
        arguments_id: "#num_clusters_argument",
        read_args: read_number_of_clusters
    },
    kmeans_opt: {
        algo: (sorted_data, args, dimension) => kmeans_splits(sorted_data, args, dimension, "optimal"),
        arguments_id: "#num_clusters_argument",
        read_args: read_number_of_clusters
    },
    osaragi: {
        algo: (sorted_data, args, dimension) => MIL_splits(sorted_data, args, dimension, "kmeans"),
        arguments_id: "#num_clusters_argument",
        read_args: read_number_of_clusters
    },
    log: {
        algo: (sorted_data, args, dimension) => new LogMapper([[sorted_data[0], sorted_data[sorted_data.length - 1]]], [0, 1]),
        arguments_id: null,
        read_args: () => {}
    },
    sqrt: {
        algo: (sorted_data, args, dimension) => new SqrtMapper([[sorted_data[0], sorted_data[sorted_data.length - 1]]], [0, 1]),
        arguments_id: null,
        read_args: () => {}
    },
    pow: {
        algo: (sorted_data, args, dimension) => new PowMapper([[sorted_data[0], sorted_data[sorted_data.length - 1]]], [0, 1], args.exponent),
        arguments_id: "#exponent_argument",
        read_args: read_exponent
    },
    box_cox: {
        algo: (sorted_data, args, dimension) => new BoxCoxMapper([[sorted_data[0], sorted_data[sorted_data.length - 1]]], args.lambda),
        arguments_id: "#lambda_argument",
        read_args: read_lambda
    },
    uniform: {
        algo: (sorted_data, args, dimension) => new UniformMapper(sorted_data),
        arguments_id: null,
        read_args: () => {}
    }
}

export function algorithm_selection_update(arguments_id) {
    let args = d3.select("#arguments_div").selectChildren();
    args.style("display", "none")
    if (arguments_id !== null) {
        d3.select(arguments_id).style("display", null)
    }
}

export function get_selected_algorithm() {
    return algorithm_selection_map[d3.select(algo_selector_ref).property("value")]
}