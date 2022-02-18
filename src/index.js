import {load_data} from "./load_numbeo_data";
import ParallelCoordinates from "./parallel_coordinates";
import {basic_ranges} from "./basic_ranges";

console.log("starting")
load_data().then((data) => {
    console.log(data)
    let indices_ranges = basic_ranges(data.data, data.dimensions)
    console.log(indices_ranges)
    let par_coords = new ParallelCoordinates(data.data, data.dimensions, indices_ranges);
})
