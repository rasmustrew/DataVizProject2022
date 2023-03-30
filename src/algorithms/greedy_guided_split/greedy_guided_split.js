import LinearMapper, {NormalizingMapper} from "../../mappings/linear_mapping";
import UniqueIndexMapper from "../../mappings/unique_index_mapping";
import CompositeMapper from "../../mappings/composite_mapping";
import ProportionateSplitMapper from "../../mappings/proportionate_split_mapping";
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
            let current_mapper = new ProportionateSplitMapper(sorted_data, suggested_splits)
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
    splits.sort(function (a, b) {
        return a - b;
    });

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
    return metrics.skewness * weights.skewness + metrics.distortion * weights.interpolation + metrics.fragmentation * weights.fragmentation
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

export function read_greedy_guided_split_args() {
    let weights = {}
    weights["distortion"] = parseFloat(d3.select("#distortion_argument input").property("value"))
    weights["fragmentation"] = parseFloat(d3.select("#fragmentation_argument input").property("value"))
    weights["skewness"] = parseFloat(d3.select("#skewness_argument input").property("value"))
    return weights
}

function compute_total_squared_skewness(segment) {
    if (segment.length < 2) return 0
    let max_val = Math.max(...segment)
    let min_val = Math.min(...segment)
    let n = segment.length
    let total_distance = 0
    for (let i = 0; i < n; i++) {
        let actual_pos = (segment[i] - min_val) / (max_val - min_val)
        let uniform_pos = (i + 1) / n
        total_distance += (actual_pos - uniform_pos) ** 2
    }
    return total_distance;
}

// Construct segments index ranges based on reversing through segment table
function get_segmentation_index_ranges(n, k, T) {
    let next_segment_start = n + 1
    let ranges = []
    for (let m = k; m >= 1; m--) {
        let segment_start = T[m][next_segment_start - 1] + 1
        ranges.push([segment_start, next_segment_start - 1])
        next_segment_start = segment_start
    }
    return ranges;
}

// Choose splits as means of range borders
function ranges_to_splits(ranges) {
    let splits = []
    for (let i = 1; i < ranges.length; i++) {
        let split = (ranges[i - 1][0] - ranges[i][1]) / 2 + ranges[i][1]
        splits.push(split)
    }
    return splits;
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
    for (let i = 0; i < X.length; i++) {
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

// Based on building a dynamic programming table of optimal k-means clustering of n points
// Each cell only depends on the cells to the left of it in the previous row of the table
// Assumes X is sorted
export function optimal_guided_splits(sorted_data, weights, k = 3) {
    let distortion_weight = 0
    let fragmentation_weight = 0
    const automate_k = !weights["auto_k"]
    if (automate_k) {
        distortion_weight = weights["interpolation"]
        fragmentation_weight = weights["fragmentation"]
        k = 2
    } else if ("clusters" in weights) {
        k = weights["clusters"]
    }
    let X = [...new Set(sorted_data)]
    const n = X.length
    X = [-Infinity].concat(X)
    let C = [[-1]].concat(Array(k).fill(null).map(() => Array(n + 1).fill(0)));
    let T = [[-1]].concat(Array(k).fill(null).map(() => Array(n + 1).fill(0)));
    // Set up cumulative arrays for prefix sums
    let D = [0], D2 = [0], H = [0], I = [0], I2 = [0]
    for (let i = 1; i <= n; i++) {
        D.push(D[i - 1] + X[i])
        D2.push(D2[i - 1] + X[i] ** 2)
        H.push(H[i - 1] + i * X[i])
        I.push(I[i - 1] + i)
        I2.push(I2[i - 1] + i ** 2)
    }
    // Init first row with skewness of X_i, runs O(n^2)
    for (let i = 2; i <= n + 1; i++) {
        C[1][i - 1] = compute_total_squared_skewness(X.slice(1, i))
    }
    // Init diagonal of T to fit segmentations with one point per segment
    for (let m = 2; m <= k; m++) {
        T[m][m] = m - 1
    }
    // Fill tables
    for (let m = 2; m <= Math.min(k, 10); m++) {
        for (let i = m + 1; i <= n; i++) {
            let optimal_cost_so_far = Infinity
            let split_index = 0
            // Look up cells to the left in the previous row
            for (let j = m - 1; j < i; j++) {
                //let ranges = get_segmentation_index_ranges(j, m - 1, segment_table)
                //ranges.push([j + 1, i])
                let j_squared = j ** 2
                let cost_Xj = j_squared * C[m - 1][j]
                let cost_Xji = 0
                let cost_Xji_slow = (i - j) ** 2 * compute_total_squared_skewness(X.slice(j + 1, i + 1))
                if (j !== i - 1) {
                    let size_new_seg = i - j
                    let len_new_seg = X[i] - X[j + 1]
                    let v = j * (I[i] - I[j])
                    let term1 = (D2[i] - D2[j] - (D[i] - D[j]) / X[j + 1])/ (len_new_seg ** 2)
                    let term2 = (I2[i] - I2[j] - 2 * v) / (size_new_seg ** 2)
                    let term3 = 2 * (H[i] - H[j] - v + X[j + 1] * I[size_new_seg]) / (len_new_seg * size_new_seg)
                    let term4 = size_new_seg * (X[j + 1] ** 2) / (len_new_seg ** 2) + j_squared / size_new_seg
                    cost_Xji = size_new_seg ** 2 * (term1 + term2 + term3 + term4)
                }
                let cost = cost_Xj + cost_Xji_slow
                if (cost < optimal_cost_so_far) {
                    optimal_cost_so_far = cost
                    split_index = j
                }
            }
            C[m][i] = optimal_cost_so_far / (i ** 2)
            T[m][i] = split_index
        }
        if (automate_k) {
            let ranges = get_segmentation_index_ranges(n, m, T, X).map(range => [range[0] - 1, range[1] - 1])
            ranges.sort((x1, x2) => x1[0] - x2[0])
            let distortion = compute_total_squared_distortion(ranges, X.slice(1, n + 1));
            let threshold = fragmentation_weight * m + distortion_weight ** 4 * distortion
            if (C[m][n] < threshold) {
                k = m - 1
                break;
            } else {
                k = Math.min(k + 1, 10)
                C.push(new Array(n + 1).fill(0))
                T.push(new Array(n + 1).fill(0))
                T[k][k] = k - 1
            }
        }
    }

    let index_ranges = get_segmentation_index_ranges(n, k, T, X)
    let ranges = index_ranges.map(range => range.map(i => X[i]))
    let splits = ranges_to_splits(ranges)
    splits.sort((i, j) => i - j)
    return new ProportionateSplitMapper(sorted_data, splits)
}
