import LinearMapper, {NormalizingMapper} from "../../mappings/linear_mapping";
import UniqueIndexMapper from "../../mappings/unique_index_mapping";
import CompositeMapper from "../../mappings/composite_mapping";
import {proportionate_split_mapper} from "../../mappings/proportionate_split_mapping";
import * as d3 from "d3";

export function make_extreme_mapper(sorted_data) {
    let unique_index_mapper = new UniqueIndexMapper(sorted_data)
    return new CompositeMapper([
        unique_index_mapper,
        new LinearMapper(unique_index_mapper.get_output_space_ranges(), [0, 1])
    ]);
}

export function greedy_guided_split(sorted_data, weights) {
    let suggested_split_points = sorted_data;
    let input_range = [sorted_data[0], sorted_data[sorted_data.length - 1]]
    let linear_mapper = new NormalizingMapper(sorted_data)
    let extreme_mapper = make_extreme_mapper(sorted_data);

    let metrics_without_splits = compute_metrics(sorted_data, linear_mapper, linear_mapper, extreme_mapper)
    let metric_without_splits = compute_total_metric(metrics_without_splits, weights)

    let current_best_metric = metric_without_splits
    let confirmed_splits = []
    let current_best_mapper = linear_mapper;
    let current_best_metrics = metrics_without_splits
    let improving = true
    while (improving) {
        improving = false;
        let current_best_splits = confirmed_splits
        for (let split_point of suggested_split_points) {
            if (current_best_splits.includes(split_point)) {
                continue
            }
            let suggested_splits = insert_split(confirmed_splits, split_point)
            let current_mapper = proportionate_split_mapper(sorted_data, suggested_splits)
            let metrics = compute_metrics(sorted_data, current_mapper, linear_mapper, extreme_mapper)
            let current_metric = compute_total_metric(metrics, weights)
            if (current_metric < current_best_metric) {
                // console.log("improved")
                // console.log("improvement: ", current_best_metric - current_metric)
                improving = true
                current_best_metric = current_metric
                current_best_splits = suggested_splits
                current_best_mapper = current_mapper
                current_best_metrics = metrics
            }
        }
        if (improving) {
            confirmed_splits = current_best_splits
        }
    }

    // console.log(weights)
    // console.log(metrics_without_splits)
    // console.log(metric_without_splits)
    // console.log(current_best_metrics)
    // console.log(current_best_metric)
    // console.log("improvement: ", metric_without_splits - current_best_metric)
    console.log(current_best_mapper.get_input_space_ranges())
    return current_best_mapper
}

function insert_split(splits, new_split) {
    splits = [...splits, new_split]
    splits.sort((a, b) => a - b);
    return splits
}

function compute_metrics(data, current_mapping, linear_mapping, extreme_mapping) {
    let fragmentation = current_mapping.get_output_space_ranges().length - 1

    // Consider if skewness should be difference squared instead
    let distortion = mapping_difference(data, current_mapping, linear_mapping)
    let skewness = mapping_difference(data, current_mapping, extreme_mapping)

    return {
        skewness,
        distortion,
        fragmentation,
    }
}

function compute_total_metric(metrics, weights) {
    return metrics.skewness * weights.uniformity + metrics.distortion * (1 - weights.distortion) + metrics.fragmentation * (0.1 - weights.fragmentation / 10)
}

export function mapping_difference(data, mapping1, mapping2) {
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

function compute_total_squared_skewness(index_ranges, X) {
    let total_skewness = 0
    for (const range of index_ranges) {
        let segment_skewness = compute_total_squared_skewness_segment(X.slice(range[0], range[1] + 1))
        total_skewness += ((range[1] - range[0] + 1) / X.length) ** 2 * segment_skewness
    }
    return total_skewness;
}

function compute_total_squared_distortion(index_ranges, X) {
    let total_distortion = 0
    let n = X.length
    let min_val = X[0]
    let max_val = X[n - 1]
    let data_space_size = max_val - min_val
    let cur_segment = 0
    let cur_segment_offset = (index_ranges[cur_segment][0] - 1) / n
    let cur_segment_prop = (index_ranges[cur_segment][1] - index_ranges[cur_segment][0]) / n
    let cur_seg_min_val = X[index_ranges[cur_segment][0]]
    let cur_seg_max_val = X[index_ranges[cur_segment][1]]
    let cur_segment_size = cur_seg_max_val - cur_seg_min_val
    for (let i = 0; i < n; i++) {
        let x = X[i]
        if (x > cur_seg_max_val) {
            cur_segment++
            cur_segment_offset = (index_ranges[cur_segment][0] - 1) / n
            cur_segment_prop = (index_ranges[cur_segment][1] - index_ranges[cur_segment][0]) / n
            cur_seg_min_val = X[index_ranges[cur_segment][0]]
            cur_seg_max_val = X[index_ranges[cur_segment][1]]
            cur_segment_size = cur_seg_max_val - cur_seg_min_val
        }
        let x_position_in_segment = cur_segment_prop * (x - cur_seg_min_val) / cur_segment_size
        let x_projected_position = x_position_in_segment + cur_segment_offset
        let x_original_position = (x - min_val) / data_space_size
        total_distortion += (x_projected_position - x_original_position) ** 2
    }
    return total_distortion;
}
