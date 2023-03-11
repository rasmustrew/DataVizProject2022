import * as d3 from "d3";
import {entropy} from "../algorithms/util";
import {mapper_kmeans_cost, kmeans_splits, single_cluster_cost} from "../algorithms/kmeans_split";

let metric_functions = {
    entropy: entropy,
    sqrt_kmeans_cost: (data, mapper) => Math.sqrt(mapper_kmeans_cost(data, mapper)),
}

export function update_metrics_display(sorted_data, mapper) {
    let metrics = d3.selectAll(".metric_label")
    for (const metric of metrics) {
        let metric_calculator = metric_functions[metric.id]
        metric.innerHTML = metric.id + ": " + metric_calculator(sorted_data, mapper)
    }
}