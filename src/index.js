import {load_numbeo_data} from "./data/load_numbeo_data";
import ParallelCoordinates, {ScaleType} from "./parallel_coordinates";
import {simple_ranges, hardcoded_numbeo_range, hardcoded_un_range, hardcoded_animals_range} from "./data_ranges";
import {compute_metrics} from "./metrics";
import {load_un_data} from "./data/load_un_data";
import {load_animal_data} from "./data/load_animal_data";

console.log("starting")
load_animal_data().then((data) => {
    console.log(data)
    let dimension_ranges = simple_ranges(data.data, data.dimensions)
    let dimension_ranges_splits = hardcoded_animals_range
    let par_coords = new ParallelCoordinates(data.data, data.dimensions, dimension_ranges, "#parCoordsDivTop", ScaleType.Linear);
    let par_coords_log = new ParallelCoordinates(data.data, data.dimensions, dimension_ranges, "#parCoordsDivTop", ScaleType.Log);
    let par_coords_splits = new ParallelCoordinates(data.data, data.dimensions, dimension_ranges_splits, "#parCoordsDivBottom", ScaleType.Linear)
    console.log(dimension_ranges)
    compute_metrics(par_coords)
    compute_metrics(par_coords_log)
    compute_metrics(par_coords_splits)

    par_coords.draw()
    par_coords_log.draw()
    par_coords_splits.draw()
})

