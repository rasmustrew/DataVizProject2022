import {load_numbeo_data} from "./data/load_numbeo_data";
import * as d3 from "d3";
import ParallelCoordinates, {ScaleType} from "./parallel_coordinates";
import {
    simple_ranges,
    hardcoded_numbeo_range,
    hardcoded_un_range,
    hardcoded_animals_range,
    hardcoded_periodic_table_range, naive_single_split_ranges
} from "./data_ranges";
import {compute_metrics} from "./metrics";
import {load_un_data} from "./data/load_un_data";
import {load_animal_data} from "./data/load_animal_data";
import {load_periodic_table_data} from "./data/load_periodic_table_data";

console.log("starting")



function create_par_coords(data) {
    load_periodic_table_data().then((data) => {
        // let weights = [1, 2, 0.1]

        let weights = []
        weights["norm_diff"] = parseFloat(d3.select("#normDiff input").property("value"))
        weights["max_dist"] = parseFloat(d3.select("#maxDist input").property("value"))
        weights["min_dist"] = parseFloat(d3.select("#minDist input").property("value"))
        weights["num_splits"] = parseFloat(d3.select("#numSplits input").property("value"))

        let par_coords = new ParallelCoordinates(data.data, data.dimensions, simple_ranges(data.data, data.dimensions), "#parCoordsDivTop", ScaleType.Linear);
        // let par_coords_log = new ParallelCoordinates(data.data, data.dimensions, simple_ranges(data.data, data.dimensions), "#parCoordsDivTop", ScaleType.Log);

        let hardcoded_par_coords_splits = new ParallelCoordinates(data.data, data.dimensions, hardcoded_periodic_table_range," #parCoordsDivMiddle", ScaleType.Linear)

        let par_coords_splits = new ParallelCoordinates(data.data, data.dimensions, simple_ranges(data.data, data.dimensions), "#parCoordsDivBottom", ScaleType.Linear)
        let naive_result = naive_single_split_ranges(data.dimensions, simple_ranges(data.data, data.dimensions), par_coords_splits, weights)
        par_coords_splits.set_dimension_ranges(naive_result.ranges)

        let base_metrics = compute_metrics(par_coords, par_coords.dimensions, weights)
        // let log_metrics = compute_metrics(par_coords_log, par_coords.dimensions)
        let hardcoded_split_metrics = compute_metrics(hardcoded_par_coords_splits, weights)
        let split_metrics = compute_metrics(par_coords_splits, weights)

        console.log("base: ", base_metrics)
        // console.log("log: ", log_metrics)
        console.log("hardcoded split: ", hardcoded_split_metrics)
        console.log("split: ", split_metrics)
        console.log(naive_result)

        par_coords.draw()
        par_coords_splits.draw()
        hardcoded_par_coords_splits.draw()

    })

}

function destroy_par_coords() {
    d3.select("#parCoordsDivTop svg").remove()
    d3.select("#parCoordsDivMiddle svg").remove()
    d3.select("#parCoordsDivBottom svg").remove()
}

export function recompute_par_coords() {
    console.log("RECOMPUTING")
    destroy_par_coords()
    create_par_coords()
}
window.recompute = recompute_par_coords

create_par_coords()

