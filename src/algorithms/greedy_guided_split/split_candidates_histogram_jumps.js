import {simple_ranges} from "./data_ranges";

function create_histograms(data, dimensions, simple_ranges, num_bins) {

    let bins = {}
    for (let dimension of dimensions) {
        bins[dimension] = Array(num_bins).fill(0)
    }

    for (let item of data) {
        for (let dimension of dimensions) {
            let value = item[dimension] - simple_ranges[dimension][0][0]
            let percent = value / (simple_ranges[dimension][0][1] - simple_ranges[dimension][0][0])
            let bin = Math.floor(percent * (num_bins - 1))
            bins[dimension][bin] += 1
        }
    }
    return bins
}

function find_biggest_histogram_jumps(histogram, num_jumps) {
    let biggest_jumps = Array(num_jumps).fill(0)
    let biggest_jumps_indices = []

    for (let i = 0; i < histogram.length - 1; i++) {
        let jump_size = Math.abs(histogram[i] - histogram[i+1])

        let smallest_big_jump = biggest_jumps[0]
        let smallest_big_jump_index = 0
        for (let jump_index in biggest_jumps) {
            let big_jump = biggest_jumps[jump_index]
            if (big_jump < smallest_big_jump) {
                smallest_big_jump = big_jump
                smallest_big_jump_index = jump_index
            }
        }

        if (jump_size > smallest_big_jump) {
            biggest_jumps[smallest_big_jump_index] = jump_size
            biggest_jumps_indices[smallest_big_jump_index] = i
        }
    }
    return biggest_jumps_indices
}

function compute_points_from_histogram_indices(jump_indices, simple_ranges, histogram_size) {
    let jump_domain_values = []
    for (let jump_index of jump_indices) {
        let percent_value = (jump_index + 1) / histogram_size
        let value = percent_value * (simple_ranges[0][1] - simple_ranges[0][0]) + simple_ranges[0][0]
        jump_domain_values.push(value)
    }
    return jump_domain_values
}

export function compute_split_candidates_histogram_jumps(data, dimensions) {
    console.log(simple_ranges(data, dimensions))
    let simple_ranges_jumps = simple_ranges(data, dimensions)
    let histograms_10 = create_histograms(data, dimensions, simple_ranges_jumps, 10)
    let histograms_100 = create_histograms(data, dimensions, simple_ranges_jumps, 100)
    let histograms_1000 = create_histograms(data, dimensions, simple_ranges_jumps, 1000)
    let histograms_10000 = create_histograms(data, dimensions, simple_ranges_jumps, 10000)
    let histograms_100000 = create_histograms(data, dimensions, simple_ranges_jumps, 1000000)
    let histograms_1000000 = create_histograms(data, dimensions, simple_ranges_jumps, 10000000)
    let biggest_jumps = {}
    for (let dimension of dimensions) {
        let biggest_jumps_10 = find_biggest_histogram_jumps(histograms_10[dimension], 5)
        let domain_values_10 = compute_points_from_histogram_indices(biggest_jumps_10, simple_ranges_jumps[dimension], 10)
        let biggest_jumps_100 = find_biggest_histogram_jumps(histograms_100[dimension], 20)
        let domain_values_100 = compute_points_from_histogram_indices(biggest_jumps_100, simple_ranges_jumps[dimension], 100)
        let biggest_jumps_1000 = find_biggest_histogram_jumps(histograms_1000[dimension], 20)
        let domain_values_1000 = compute_points_from_histogram_indices(biggest_jumps_1000, simple_ranges_jumps[dimension], 1000)
        let biggest_jumps_10000 = find_biggest_histogram_jumps(histograms_10000[dimension], 20)
        let domain_values_10000 = compute_points_from_histogram_indices(biggest_jumps_10000, simple_ranges_jumps[dimension], 10000)
        let biggest_jumps_100000 = find_biggest_histogram_jumps(histograms_100000[dimension], 20)
        let domain_values_100000 = compute_points_from_histogram_indices(biggest_jumps_100000, simple_ranges_jumps[dimension], 1000000)
        let biggest_jumps_1000000 = find_biggest_histogram_jumps(histograms_1000000[dimension], 20)
        let domain_values_1000000 = compute_points_from_histogram_indices(biggest_jumps_1000000, simple_ranges_jumps[dimension], 10000000)
        biggest_jumps[dimension] = domain_values_10.concat(domain_values_100).concat(domain_values_1000).concat(domain_values_10000).concat(domain_values_100000).concat(domain_values_1000000)
    }
    return biggest_jumps;
}
