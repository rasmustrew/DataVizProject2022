

// Construct segments index ranges based on reversing through segment table
import PrettySegmentMapper from "../mappings/pretty_segment_mapping";
import ProportionateSplitMapper from "../mappings/proportionate_split_mapping";

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


export function greedy_interpolated_splits(sorted_data, weights) {
    let k = 10
    let stopping_condition = weights["stopping_condition"]
    let interpolation_weight = weights["uniformity"]
    let distortion_weight = 1 - weights["distortion"]
    let fragmentation_weight = weights["fragmentation"]
    if (stopping_condition === "k") {
        k = weights["clusters"]
    }
    // Remove duplicate values
    let X = [...new Set(sorted_data)]
    const n = X.length
    // Compute single segment cost
    let single_segment_cost = compute_total_squared_interpolation_cost([[0, n - 1]], X, interpolation_weight)
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
        if (stopping_condition === "dist_frac") {
            let distortion_threshold = 0
            if (distortion_weight !== 0) {
                let index_ranges = []
                for (let j = 0; j <= split_indices.length; j++) {
                    let index_begin = j === 0 ? 0 : split_indices[j - 1]
                    let index_end = j === split_indices.length ? n - 1 : split_indices[j]
                    index_ranges.push([index_begin, index_end])
                }
                let total_distortion = compute_total_squared_distortion(index_ranges, X)
                distortion_threshold = distortion_weight ** 4 * total_distortion
            }
            let threshold = fragmentation_weight - distortion_threshold
            if (split_indices.length / 10 > threshold) {
                break
            }
        }
        if (stopping_condition === "threshold") {
            if (split_indices.length / 10 > fragmentation_weight) {
                break
            }
        }
        split_indices.push(best_index)
        split_indices.sort()
    }
    let splits = split_indices.map(index => (X[index] - X[index - 1]) / 2 + X[index - 1])
    splits.sort((i, j) => i - j)
    return new PrettySegmentMapper(sorted_data, new ProportionateSplitMapper(sorted_data, splits))
}

let automate_k_cost_reduction = false

/* Based on building a dynamic programming table of optimal k-means clustering of n points
 * Each cell only depends on the cells to the left of it in the previous row of the table
 * Assumes X is sorted
 * Stopping condition can be one of: k, dist_frac, cost_reduction, threshold
*/
export function optimal_guided_splits(sorted_data, weights, k = 3) {
    let stopping_condition = weights["stopping_condition"]
    let distortion_weight = 1 - weights["distortion"]
    let fragmentation_weight = 1 - weights["fragmentation"]
    if (stopping_condition !== "k") {
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
        C[1][i - 1] = compute_total_squared_skewness_segment(X.slice(1, i))
    }
    // Init diagonal of T to fit segmentations with one point per segment
    for (let m = 2; m <= k; m++) {
        T[m][m] = m - 1
    }
    // Fill tables
    for (let m = 2; m <= Math.min(k, 10); m++) {
        // For visualizing the cost matrix of split point location
        let B = Array(n + 1).fill(null).map(() => Array(n + 1).fill(0))
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
                //let cost_Xji_slow = (i - j) ** 2 * compute_total_squared_skewness_segment(X.slice(j + 1, i + 1))
                if (j !== i - 1) {
                    let seg_size = i - j
                    let seg_len = X[i] - X[j + 1]
                    let v = D[i] - D[j]
                    let term1 = (seg_size * (X[j + 1] ** 2) + D2[i] - D2[j] - 2 * X[j + 1] * v)/ (seg_len ** 2)
                    let term2 = I2[seg_size] / (seg_size ** 2)
                    let term3 = 2 * (H[i] - H[j] - j * v - X[j + 1] * I[seg_size]) / (seg_len * seg_size)
                    cost_Xji = (seg_size ** 2) * (term1 + term2 - term3)
                }
                let cost = cost_Xj + cost_Xji
                B[i][j] = cost
                if (cost < optimal_cost_so_far) {
                    optimal_cost_so_far = cost
                    split_index = j
                }
            }
            C[m][i] = optimal_cost_so_far / (i ** 2)
            T[m][i] = split_index
        }
        // Stopping conditions
        if (stopping_condition === "dist_frac") {
            let ranges = get_segmentation_index_ranges(n, m, T, X).map(range => [range[0] - 1, range[1] - 1])
            ranges.sort((x1, x2) => x1[0] - x2[0])
            let distortion = compute_total_squared_distortion(ranges, X.slice(1, n + 1));
            let threshold = fragmentation_weight * m + distortion_weight ** 4 * distortion
            if (C[m][n] < threshold) {
                k = m - 1
                break
            }
        }
        if (stopping_condition === "threshold") {
            if (m / 10 > fragmentation_weight) {
                k = m - 1
                break;
            }
        }
        if (stopping_condition === "cost_reduction") {
            let cost_reduction = (C[m - 1][n] - C[m][n]) / C[m - 1][1]
            if (cost_reduction < 0.1) {
                k = m - 1
                break
            }
        }
        if (stopping_condition !== "k") {
            k = Math.min(k + 1, 10)
            C.push(new Array(n + 1).fill(0))
            T.push(new Array(n + 1).fill(0))
            T[k][k] = k - 1
        }
    }

    let index_ranges = get_segmentation_index_ranges(n, k, T, X)
    let ranges = index_ranges.map(range => range.map(i => X[i]))
    let splits = ranges_to_splits(ranges)
    splits.sort((i, j) => i - j)
    return new PrettySegmentMapper(sorted_data, new ProportionateSplitMapper(sorted_data, splits))
}


export function guided_splits(sorted_data, weights) {
    if (weights.uniformity === 1)
        return optimal_guided_splits(sorted_data, weights)
    else
        return greedy_interpolated_splits(sorted_data, weights)
}
