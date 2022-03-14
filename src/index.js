import {load_numbeo_data} from "./data/load_numbeo_data";
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
load_periodic_table_data().then((data) => {
    console.log(data)
    let weights = [1, 2, 0.1]
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
    // par_coords_log.draw()

})

