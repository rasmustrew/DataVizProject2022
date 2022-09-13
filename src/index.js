import {load_numbeo_data} from "./data/load_numbeo_data";
import * as d3 from "d3";
import ParallelCoordinates, {ScaleType} from "./parallel_coordinates";
import {
    simple_ranges,
    hardcoded_numbeo_range,
    hardcoded_un_range,
    hardcoded_animals_range,
    hardcoded_periodic_table_range, naive_multisplit, guided_split, extreme_split
} from "./data_ranges";
import {compute_metrics, plot_diff_individual} from "./metrics";
import {load_un_data} from "./data/load_un_data";
import {load_animal_data} from "./data/load_animal_data";
import {load_periodic_table_data} from "./data/load_periodic_table_data";
import {
    convergence,
    divergence,
    number_of_line_crossings,
    overplotting_2d, pretty_print_benchmark, pretty_print_benchmarks,
    screen_histogram_2d
} from "./pargnostics_benchmarks";
import APC from "./apc";

console.log("starting")

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


function create_split_pc(data, sorted_data, element_id) {

    let weights = {}
    weights["distortion"] = parseFloat(d3.select("#distortion input").property("value"))
    weights["fragmentation"] = parseFloat(d3.select("#fragmentation input").property("value"))
    weights["skewness"] = parseFloat(d3.select("#skewness input").property("value"))

    console.log(simple_ranges(data.data, data.dimensions))
    let simple_ranges_jumps = simple_ranges(data.data, data.dimensions)
    let histograms_10 = create_histograms(data.data, data.dimensions, simple_ranges_jumps, 10)
    let histograms_100 = create_histograms(data.data, data.dimensions, simple_ranges_jumps, 100)
    let histograms_1000 = create_histograms(data.data, data.dimensions, simple_ranges_jumps, 1000)
    let histograms_10000 = create_histograms(data.data, data.dimensions, simple_ranges_jumps, 10000)
    let histograms_100000 = create_histograms(data.data, data.dimensions, simple_ranges_jumps, 1000000)
    let histograms_1000000 = create_histograms(data.data, data.dimensions, simple_ranges_jumps, 10000000)
    let biggest_jumps = {}
    for (let dimension of data.dimensions) {
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
    console.log(biggest_jumps)

    let par_coords = new ParallelCoordinates(data.data,sorted_data, data.dimensions, simple_ranges(data.data, data.dimensions), element_id, ScaleType.Linear);
    let par_coords_extreme = new ParallelCoordinates(data.data, sorted_data, data.dimensions, simple_ranges(data.data, data.dimensions),element_id, ScaleType.Linear, undefined, true);

    let par_coords_splits = new ParallelCoordinates(data.data, sorted_data, data.dimensions, simple_ranges(data.data, data.dimensions), element_id, ScaleType.Linear, [])
    let guided_result = guided_split(data.dimensions, simple_ranges(data.data, data.dimensions), par_coords_splits, weights, biggest_jumps, par_coords, par_coords_extreme)
    par_coords_splits.set_dimension_ranges(guided_result.ranges)

    return par_coords_splits
}

function destroy_par_coords() {
    d3.select(".par_coords svg").remove()
    d3.select("#single_par_coords svg").remove()
}

export function recompute_par_coords() {
    console.log("RECOMPUTING")
    destroy_par_coords()
    create_par_coords(data, sorted_data)
}

function create_par_coords(data, sorted_data, element_id, type) {
    let par_coords;
    switch (type) {
        case "simple":
            par_coords = new ParallelCoordinates(data.data, sorted_data, data.dimensions, simple_ranges(data.data, data.dimensions), element_id, ScaleType.Linear);
            break
        case "symlog":
            par_coords = new ParallelCoordinates(data.data, sorted_data, data.dimensions, simple_ranges(data.data, data.dimensions), element_id, ScaleType.Log);
            break
        case "extreme":
            par_coords = new ParallelCoordinates(data.data, sorted_data, data.dimensions, simple_ranges(data.data, data.dimensions),element_id, ScaleType.Linear, undefined, true);
            break
        case "apc":
            par_coords = new APC(data.data, sorted_data, data.dimensions, simple_ranges(data.data, data.dimensions), element_id)
            break
        case "sqrt":
            par_coords = new ParallelCoordinates(data.data, sorted_data, data.dimensions, simple_ranges(data.data, data.dimensions), element_id, ScaleType.Sqrt);
            break
        case "hardcoded":
            par_coords = new ParallelCoordinates(data.data, sorted_data, data.dimensions, hardcoded_periodic_table_range,element_id, ScaleType.Linear)
            break
        case "split":
            par_coords = create_split_pc(data, sorted_data, element_id)
    }

    par_coords.draw()
    console.log("Benchmarks:")
    pretty_print_benchmarks(par_coords)
}

window.recompute = recompute_par_coords

let sorted_data = {}
let data
load_periodic_table_data().then((data_inc) => {
    data = data_inc
    for (let dimension of data.dimensions) {
        let data_values = data.data.map(value => value[dimension])
        data_values.sort(function (a, b) {
            return b - a;
        });
        sorted_data[dimension] = data_values
    }

    create_par_coords(data, sorted_data, "#parCoordsDiv1", "simple")
    create_par_coords(data, sorted_data, "#parCoordsDiv2", "split")
    create_par_coords(data, sorted_data, "#parCoordsDiv3", "extreme")
})

