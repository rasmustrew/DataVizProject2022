// Construct segments index ranges based on reversing through segment table
import {proportionate_split_mapper} from "../mappings/proportionate_split_mapping";

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

function compute_total_squared_skewness_segment(segment) {
    if (segment.length < 2) return 0
    let max_val = Math.max(...segment)
    let min_val = Math.min(...segment)
    let n = segment.length
    let total_skewness = 0
    for (let i = 0; i < n; i++) {
        let actual_pos = (segment[i] - min_val) / (max_val - min_val)
        let uniform_pos = (i + 1) / n
        total_skewness += (actual_pos - uniform_pos) ** 2
    }
    return total_skewness;
}

function compute_total_squared_interpolation_cost(index_ranges, X, interpolation_weight) {
    let total_cost = 0
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
        let x_uniform_position = (i + 1) / n;
        let x_ideal_interpolated_position = interpolation_weight * x_uniform_position + (1 - interpolation_weight) * x_original_position
        total_cost += (x_projected_position - x_ideal_interpolated_position) ** 2
    }
    return total_cost;
}


export function greedy_interpolated_splits(sorted_data, weights, stopping_callback) {
    let k = 10
    let interpolation_weight = weights["uniformity"]
    // Remove duplicate values
    let X = [...new Set(sorted_data)]
    const n = X.length
    // Compute single segment cost
    let single_segment_cost = compute_total_squared_interpolation_cost([[0, n - 1]], X, interpolation_weight)
    let previous_cost = single_segment_cost
    let current_cost = single_segment_cost
    let split_indices = []
    for (let m = 1; m < k; m++) {
        let best_cost_so_far = Infinity
        let best_index = 0
        // Test the cost of any split between i - 1 and i
        for (let i = 1; i < n; i++) {
            if (split_indices.includes(i)) continue
            let index_ranges = []
            let new_split_not_added = true
            for (let j = 0; j <= split_indices.length; j++) {
                let index_begin = j === 0 ? 0 : split_indices[j - 1]
                let index_end = j === split_indices.length ? n - 1 : split_indices[j]
                if (new_split_not_added && i < index_end && i > index_begin) {
                    index_ranges.push([index_begin, i])
                    index_ranges.push([i, index_end])
                } else {
                    index_ranges.push([index_begin, index_end])
                }
            }
            let cost = compute_total_squared_interpolation_cost(index_ranges, X, interpolation_weight)
            if (cost < best_cost_so_far) {
                best_cost_so_far = cost
                best_index = i
            }
        }
        current_cost = best_cost_so_far

        let callback_info = {
            num_splits: m,
            data_length: X.length,
            cost_now:current_cost,
            cost_previous: previous_cost,
        }

        if (stopping_callback(callback_info)) {
            split_indices.push(best_index)
            split_indices.sort()
        } else {
            break
        }


    }
    let splits = split_indices.map(index => (X[index] - X[index - 1]) / 2 + X[index - 1])
    splits.sort((i, j) => i - j)
    return splits
}


/* Based on building a dynamic programming table of optimal k-means clustering of n points
 * Each cell only depends on the cells to the left of it in the previous row of the table
 * Assumes X is sorted
 * Stopping condition can be one of: k, dist_frac, cost_reduction, threshold
*/
export function optimal_guided_splits(sorted_data, weights, stopping_callback) {
    let max_splits = 10
    let num_splits = 0
    let X = [...new Set(sorted_data)]
    const n = X.length
    X = [-Infinity].concat(X)
    let C = [[-1]].concat(Array(max_splits).fill(null).map(() => Array(n + 1).fill(0)));
    let T = [[-1]].concat(Array(max_splits).fill(null).map(() => Array(n + 1).fill(0)));
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
        C[1][i - 1] = compute_total_squared_skewness_segment(X.slice(1, i))
    }
    // Init diagonal of T to fit segmentations with one point per segment
    for (let m = 2; m <= max_splits; m++) {
        T[m][m] = m - 1
    }
    // Fill tables
    for (let m = 2; m <= Math.min(max_splits, 10); m++) {
        // For visualizing the cost matrix of split point location
        for (let i = m + 1; i <= n; i++) {
            let optimal_cost_so_far = Infinity
            let split_index = 0
            // Look up cells to the left in the previous row
            for (let j = m - 1; j < i; j++) {
                let seg_size = i - j
                let cost_Xj = C[m - 1][j]
                let cost_Xji = 0
                //let cost_Xji_slow = compute_total_squared_skewness_segment(X.slice(j + 1, i + 1))
                if (j !== i - 1) {
                    let seg_len = X[i] - X[j + 1]
                    let v = D[i] - D[j]
                    let term1 = (seg_size * (X[j + 1] ** 2) + D2[i] - D2[j] - 2 * X[j + 1] * v)/ (seg_len ** 2)
                    let term2 = I2[seg_size] / (seg_size ** 2)
                    let term3 = 2 * (H[i] - H[j] - j * v - X[j + 1] * I[seg_size]) / (seg_len * seg_size)
                    cost_Xji = term1 + term2 - term3
                }
                let cost = (j ** 2) * cost_Xj + (seg_size ** 2) * cost_Xji
                if (cost < optimal_cost_so_far) {
                    optimal_cost_so_far = cost
                    split_index = j
                }
            }
            C[m][i] = optimal_cost_so_far / (i ** 2)
            T[m][i] = split_index
        }
        // Stopping conditions

        let callback_info = {
            num_splits: m - 1,
            data_length: X.length,
            cost_now: C[m][n],
            cost_previous: C[m - 1][n],
        }

        if (!stopping_callback(callback_info)) {
            num_splits = m - 1
            break
        }

        // if (stopping_condition === "threshold") {
        //     let threshold = (fragmentation_weight/2) ** 4 + 0.001 * m
        //     if (C[m][n] / X.length < threshold) {
        //         max_splits = m - 1
        //         break;
        //     }
        // }
        // if (stopping_condition === "cost_reduction") {
        //     let cost_reduction = (C[m - 1][n] - C[m][n]) / X.length
        //     let reduction_threshold = fragmentation_weight ** 2 + 0.001 * m
        //     if (cost_reduction < reduction_threshold) {
        //         max_splits = m - 1
        //         break
        //     }
        // }
        // if (stopping_condition !== "k") {
        //     max_splits = Math.min(max_splits + 1, 10)
        //     C.push(new Array(n + 1).fill(0))
        //     T.push(new Array(n + 1).fill(0))
        //     T[max_splits][max_splits] = max_splits - 1
        // }
    }

    let index_ranges = get_segmentation_index_ranges(n, num_splits, T, X)
    let ranges = index_ranges.map(range => range.map(i => X[i]))
    let splits = ranges_to_splits(ranges)
    splits.sort((i, j) => i - j)
    return splits
}


export function guided_splits(sorted_data, weights) {
    if (weights.uniformity === 1)
        return optimal_guided_splits(sorted_data, weights)
    else
        return greedy_interpolated_splits(sorted_data, weights)
}
