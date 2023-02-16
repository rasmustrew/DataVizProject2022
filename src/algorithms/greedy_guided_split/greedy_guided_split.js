import LinearMapper from "../../mappings/linear_mapping";
import UniqueIndexMapper from "../../mappings/unique_index_mapping";
import CompositeMapper from "../../mappings/composite_mapping";
import {compute_metrics} from "../../metrics";
import ProportionateSplitMapper from "../../mappings/proportionate_split_mapping";

function greedy_guided_split(sorted_data, weights, suggested_split_points) {
    let input_range = [sorted_data[0], sorted_data[sorted_data.length - 1]]
    let linear_mapper = LinearMapper([input_range], [0, 1])
    let unique_index_mapper = UniqueIndexMapper(sorted_data)
    let extreme_mapper = CompositeMapper([
        unique_index_mapper,
        LinearMapper(unique_index_mapper.get_output_space_ranges(), [0, 1])
    ])

    let metrics_without_splits = compute_metrics(sorted_data, linear_mapper, linear_mapper, extreme_mapper)

    let current_best_metric = compute_total_metric(metrics_without_splits, weights)
    let current_best_splits = []
    let current_best_mapper = linear_mapper;
    let improving = true
    while (improving) {
        improving = false;
        for (let split_point of suggested_split_points) {
            if (current_best_splits.includes(split_point)) {
                continue
            }

            let suggested_splits = insert_split(current_best_splits, split_point)
            let current_mapper = ProportionateSplitMapper(sorted_data, suggested_splits)
            let metrics = compute_metrics(sorted_data, current_mapper, linear_mapper, extreme_mapper)
            let current_metric = compute_total_metric(metrics, weights)
            if (current_metric < current_best_metric) {
                improving = true
                current_best_metric = current_metric
                current_best_splits = suggested_splits
                current_best_mapper = current_mapper
            }
        }
    }
    return current_best_mapper
}

function insert_split(splits, new_split) {
    splits = [...splits]
    let insert_index = splits.length - 1
    for (let i = 0; i < splits.length; i++) {
        if (new_split < splits[i]) {
            insert_index = i
        }
    }
    splits.splice(insert_index, 0, new_split)
    return splits
}

function compute_metrics(data, current_mapping, linear_mapping, extreme_mapping) {
    let fragmentation = current_mapping.get_output_space_ranges().length - 1

    let distortion = mapping_difference(data, current_mapping, linear_mapping)
    let skewness = mapping_difference(data, current_mapping, extreme_mapping)

    return {
        skewness,
        distortion,
        fragmentation,
    }
}

function compute_total_metric(metrics, weights) {
    return metrics.skewness * weights.skewness + metrics.distortion * weights.distortion + metrics.fragmentation * weights.fragmentation
}

function mapping_difference(data, mapping1, mapping2) {
    let summed_diff = 0
    for (let i = 0; i < data.length; i++) {
        let input = data[i]
        let output1 = mapping1.map(input)
        let output2 = mapping2.map(input)
        let diff = Math.abs(output1 - output2)
        summed_diff += diff
    }
    return summed_diff / data.length
}