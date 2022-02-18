import {load_data} from "./load_numbeo_data";
import ParallelCoordinates from "./parallel_coordinates";

console.log("starting")
load_data().then((data) => {
    console.log(data)
    let par_coords = new ParallelCoordinates(data.data, data.dimensions, data.dimension_ranges);
})
