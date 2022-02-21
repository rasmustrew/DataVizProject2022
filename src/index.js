import {load_data} from "./load_numbeo_data";
import ParallelCoordinates from "./parallel_coordinates";
import {basic_ranges} from "./basic_ranges";

console.log("starting")
load_data().then((data) => {
    console.log(data)
    let indices_ranges = basic_ranges(data.data, data.dimensions)
    console.log(indices_ranges)
    let par_coords = new ParallelCoordinates(data.data, data.dimensions, indices_ranges);

    let norm_diff_per_dimension = {}
    let norm_diff = 0;
    for (let dimension of data.dimensions) {
        let summed_diff = 0;
        for (let i in data.data) {
            for (let j = i; j < data.data.length; j++) {
                let domain_ranges = indices_ranges[dimension]
                let data_i = parseFloat(data.data[i][dimension])
                let data_j = parseFloat(data.data[j][dimension])
                let data_space_diff = normalized_diff(data_i, data_j, domain_ranges)

                let screen_range = par_coords.screen_range;
                let screen_i = par_coords.y[dimension](data_i)
                let screen_j = par_coords.y[dimension](data_j)
                let screen_diff = normalized_diff(screen_i, screen_j, screen_range)

                let diff = Math.abs(data_space_diff - screen_diff)
                summed_diff += diff
            }
        }
        norm_diff_per_dimension[dimension] = summed_diff
        norm_diff += summed_diff
    }


})

function normalized_diff(i, j, range) {
    let i_normalized = (i - range[0]) / (range[1] - range[0])
    let j_normalized = (j - range[0]) / (range[1] - range[0])
    let diff_normalized = Math.abs(i_normalized - j_normalized)
    return diff_normalized
}
