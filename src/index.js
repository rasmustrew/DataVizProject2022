import {load_data} from "./data/load_numbeo_data";
import ParallelCoordinates from "./parallel_coordinates";
import {simple_ranges, hardcoded_numbeo_range} from "./data_ranges";
import {compute_metrics} from "./metrics";

console.log("starting")
load_data().then((data) => {
    console.log(data)
    let _dimension_ranges = simple_ranges(data.data, data.dimensions)
    var dimension_ranges = hardcoded_numbeo_range
    let par_coords = new ParallelCoordinates(data.data, data.dimensions, dimension_ranges);

    compute_metrics(par_coords)

    par_coords.draw()
})

