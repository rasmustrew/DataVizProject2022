import * as d3 from "d3";
import {data_range, entropy, mapper_kl_divergence} from "../algorithms/util";
import {mapper_kmeans_cost, kmeans_splits, single_cluster_cost} from "../algorithms/kmeans_split";
import {make_extreme_mapper, mapping_difference} from "../algorithms/greedy_guided_split/greedy_guided_split";
import LinearMapper, {NormalizingMapper} from "../mappings/linear_mapping";

let metric_functions = {
    entropy: entropy,
    sqrt_kmeans_cost: (data, mapper) => Math.sqrt(mapper_kmeans_cost(data, mapper)),
    distortion: (sorted_data, mapper) => mapping_difference(sorted_data, mapper, new NormalizingMapper(sorted_data)),
    skewness: (sorted_data, mapper) => mapping_difference(sorted_data, mapper, make_extreme_mapper(sorted_data)),
    kl_divergence: mapper_kl_divergence
}

export function update_metrics_display(sorted_data, mapper) {
    let metrics = d3.selectAll(".metric_label")
    for (const metric of metrics) {
        let metric_calculator = metric_functions[metric.id]
        metric.innerHTML = metric.id + ": " + metric_calculator(sorted_data, mapper)
    }
}