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
import {compute_metrics} from "./metrics";
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


function create_par_coords() {
    load_periodic_table_data().then((data) => {

        let weights = {}
        weights["norm_diff"] = parseFloat(d3.select("#normDiff input").property("value"))
        weights["num_splits"] = parseFloat(d3.select("#numSplits input").property("value"))
        weights["hist_avg"] = parseFloat(d3.select("#hist1D input").property("value"))

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
            let biggest_jumps_100 = find_biggest_histogram_jumps(histograms_100[dimension], 10)
            let domain_values_100 = compute_points_from_histogram_indices(biggest_jumps_100, simple_ranges_jumps[dimension], 100)
            let biggest_jumps_1000 = find_biggest_histogram_jumps(histograms_1000[dimension], 10)
            let domain_values_1000 = compute_points_from_histogram_indices(biggest_jumps_1000, simple_ranges_jumps[dimension], 1000)
            let biggest_jumps_10000 = find_biggest_histogram_jumps(histograms_10000[dimension], 10)
            let domain_values_10000 = compute_points_from_histogram_indices(biggest_jumps_10000, simple_ranges_jumps[dimension], 10000)
            let biggest_jumps_100000 = find_biggest_histogram_jumps(histograms_100000[dimension], 10)
            let domain_values_100000 = compute_points_from_histogram_indices(biggest_jumps_100000, simple_ranges_jumps[dimension], 1000000)
            let biggest_jumps_1000000 = find_biggest_histogram_jumps(histograms_1000000[dimension], 10)
            let domain_values_1000000 = compute_points_from_histogram_indices(biggest_jumps_1000000, simple_ranges_jumps[dimension], 10000000)
            biggest_jumps[dimension] = domain_values_10.concat(domain_values_100).concat(domain_values_1000).concat(domain_values_10000).concat(domain_values_100000).concat(domain_values_1000000)
        }
        console.log(biggest_jumps)

        let par_coords = new ParallelCoordinates(data.data, data.dimensions, simple_ranges(data.data, data.dimensions), "#parCoordsDivTop", ScaleType.Linear);
        // let par_coords_log = new ParallelCoordinates(data.data, data.dimensions, simple_ranges(data.data, data.dimensions), "#parCoordsDivMiddleTop", ScaleType.Log);
        console.log("EXTREME")
        let par_coords_log = new ParallelCoordinates(data.data, data.dimensions, simple_ranges(data.data, data.dimensions), "#parCoordsDivMiddleTop", ScaleType.Linear, undefined, true);

        // let hardcoded_par_coords_splits = new ParallelCoordinates(data.data, data.dimensions, hardcoded_periodic_table_range," #parCoordsDivMiddleBottom", ScaleType.Linear)
        let apc = new APC(data.data, data.dimensions, simple_ranges(data.data, data.dimensions), '#parCoordsDivMiddleBottom')

        let par_coords_splits = new ParallelCoordinates(data.data, data.dimensions, simple_ranges(data.data, data.dimensions), "#parCoordsDivBottom", ScaleType.Linear, [par_coords, par_coords_log, apc])

        let guided_result = guided_split(data.dimensions, simple_ranges(data.data, data.dimensions), par_coords_splits, weights, biggest_jumps)

        // let naive_result = naive_multisplit(data.dimensions, simple_ranges(data.data, data.dimensions), par_coords_splits, weights)
        par_coords_splits.set_dimension_ranges(guided_result.ranges)

        let base_metrics = compute_metrics(par_coords, par_coords.dimensions)
        let log_metrics = compute_metrics(par_coords_log, par_coords.dimensions)
        // let hardcoded_split_metrics = compute_metrics(hardcoded_par_coords_splits)
        let split_metrics = compute_metrics(par_coords_splits)

        // console.log("base: ", base_metrics)
        // console.log("log: ", log_metrics)
        // console.log("hardcoded split: ", hardcoded_split_metrics)
        // console.log("split: ", split_metrics)
        // console.log(guided_result)

        par_coords.draw()
        par_coords_log.draw()
        par_coords_splits.draw()
        apc.draw()
        // hardcoded_par_coords_splits.draw()

        console.log("PC")
        pretty_print_benchmarks(par_coords)
        console.log("symlog")
        pretty_print_benchmarks(par_coords_log)
        console.log("andrienko")
        pretty_print_benchmarks(apc)
        console.log("SPC")
        pretty_print_benchmarks(par_coords_splits)


        // let screen_histogram_hardcoded = screen_histogram_2d(hardcoded_par_coords_splits)
        // let line_crossings_hardcoded = number_of_line_crossings(screen_histogram_hardcoded)
        // let overplottings_hardcoded = overplotting(screen_histogram_hardcoded)
        // let convergences_hardcoded = convergence(screen_histogram_hardcoded)
        // let divergences_hardcoded = divergence(screen_histogram_hardcoded)
        // console.log(line_crossings_hardcoded)
        // console.log(overplottings_hardcoded)
        // console.log(convergences_hardcoded)
        // console.log(divergences_hardcoded)

        // let screen_histogram_computed = screen_histogram_2d(par_coords_splits)
        // let line_crossings_computed = number_of_line_crossings(screen_histogram_computed)
        // let overplottings_computed = overplotting(screen_histogram_computed)
        // let convergences_computed = convergence(screen_histogram_computed)
        // let divergences_computed = divergence(screen_histogram_computed)
        // console.log(line_crossings_computed)
        // console.log(overplottings_computed)
        // console.log(convergences_computed)
        // console.log(divergences_computed)
    })

}

function destroy_par_coords() {
    d3.select("#parCoordsDivTop svg").remove()
    d3.select("#parCoordsDivMiddleTop svg").remove()
    d3.select("#parCoordsDivMiddleBottom svg").remove()
    d3.select("#parCoordsDivBottom svg").remove()
}

export function recompute_par_coords() {
    console.log("RECOMPUTING")
    destroy_par_coords()
    create_par_coords()
}
window.recompute = recompute_par_coords

create_par_coords()

