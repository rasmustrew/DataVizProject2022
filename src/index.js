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
import {compute_split_candidates_histogram_jumps} from "./split_candidates_histogram_jumps";
import {
    complete_linkage,
    compute_split_candidates_hierarchial_clustering,
    single_linkage
} from "./split_candidates_hierarchial_clustering";

console.log("starting")

function create_split_pc(data, sorted_data, element_id, split_finder, linkage) {

    let weights = {}
    weights["distortion"] = parseFloat(d3.select("#distortion input").property("value"))
    weights["fragmentation"] = parseFloat(d3.select("#fragmentation input").property("value"))
    weights["skewness"] = parseFloat(d3.select("#skewness input").property("value"))

    // let split_candidates = compute_split_candidates_histogram_jumps(data.data, data.dimensions);
    let split_candidates = split_finder(data.data, data.dimensions, linkage);
    // let split_candidates = [];
    console.log(split_candidates)

    let par_coords = new ParallelCoordinates(data.data,sorted_data, data.dimensions, simple_ranges(data.data, data.dimensions), element_id, ScaleType.Linear);
    let par_coords_extreme = new ParallelCoordinates(data.data, sorted_data, data.dimensions, simple_ranges(data.data, data.dimensions),element_id, ScaleType.Linear, undefined, true);

    let par_coords_splits = new ParallelCoordinates(data.data, sorted_data, data.dimensions, simple_ranges(data.data, data.dimensions), element_id, ScaleType.Linear, [])
    let guided_result = guided_split(data.dimensions, simple_ranges(data.data, data.dimensions), par_coords_splits, weights, split_candidates, par_coords, par_coords_extreme)
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

function create_par_coords(data, sorted_data, element_id, type, linkage) {
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
            par_coords = create_split_pc(data, sorted_data, element_id, compute_split_candidates_hierarchial_clustering, linkage)
            break
        case "split_old":
            par_coords = create_split_pc(data, sorted_data, element_id, compute_split_candidates_histogram_jumps)
            break
    }

    par_coords.draw();
    console.log(type, "Benchmarks:");
    pretty_print_benchmarks(par_coords);
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
    // create_par_coords(data, sorted_data, "#parCoordsDiv2", "split", single_linkage)
    create_par_coords(data, sorted_data, "#parCoordsDiv2", "split_old")
    create_par_coords(data, sorted_data, "#parCoordsDiv3", "split", complete_linkage)
})

