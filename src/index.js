import {load_data} from "./load_numbeo_data";
import ParallelCoordinates from "./parallel_coordinates";
import {basic_ranges} from "./basic_ranges";

console.log("starting")
load_data().then((data) => {
    console.log(data)
    let _indices_ranges = basic_ranges(data.data, data.dimensions)
    var indices_ranges = {
        'crime_index': [[0, 100]],
        'traffic_index': [[0, 320]],//unbounded max
        // 'rent_index': [[0, 5], [5, 20], [20, 65], [65, 300]],//unbounded max, 100 is new york
        // 'rent_index': [[0, 80], [100, 300]],
        // 'rent_index': [[0, 101]],
        'rent_index': [[0, 20], [20, 101]],
        'groceries_index': [[0, 150]],//unbounded max, 100 is new york
        'restaurant_price_index': [[0, 170]],//unbounded max, 100 is new york
        'pollution_index': [[0, 100]],//actual values seem to be going to 113?
        'health_care_index': [[0, 100]],
        'quality_of_life_index': [[0, 200]],//unbounded
    }
    console.log(indices_ranges)
    console.log(_indices_ranges)
    let par_coords = new ParallelCoordinates(data.data, data.dimensions, indices_ranges);
    let screen_range = par_coords.screen_range;

    let norm_diff_per_dimension = {}
    let norm_diff = 0;
    for (let dimension of data.dimensions) {
        let summed_diff = 0;
        for (let i in data.data) {
            for (let j = i; j < data.data.length; j++) {
                let domain_range = total_range(indices_ranges[dimension])
                let data_i = parseFloat(data.data[i][dimension])
                let data_j = parseFloat(data.data[j][dimension])
                let data_space_diff = normalized_diff(data_i, data_j, domain_range)

                let screen_i = par_coords.y_position(data_i, dimension)
                let screen_j = par_coords.y_position(data_j, dimension)
                let screen_diff = normalized_diff(screen_i, screen_j, screen_range)

                let diff = Math.abs(data_space_diff - screen_diff)
                summed_diff += diff
            }
        }
        norm_diff_per_dimension[dimension] = summed_diff
        norm_diff += summed_diff
    }
    console.log(norm_diff_per_dimension)


    let max_diff_per_dimension = {}
    for (let dimension of data.dimensions) {
        max_diff_per_dimension[dimension] = 0;

        let sorted_data = []
        for (let i in data.data) {
            sorted_data.push(parseFloat(data.data[i][dimension]))
        }
        sorted_data.sort(function (a,b) {return a - b;});

        for (let i = 0; i < sorted_data.length - 1; i++) {
            let j = i + 1
            let data_i = sorted_data[i]
            let data_j = sorted_data[j]

            let screen_i = par_coords.y_position(data_i, dimension)
            let screen_j = par_coords.y_position(data_j, dimension)
            let norm_diff = normalized_diff(screen_i, screen_j, screen_range)
            max_diff_per_dimension[dimension] = Math.max(max_diff_per_dimension[dimension], norm_diff)
        }
    }
    console.log(max_diff_per_dimension)
})

function normalized_diff(i, j, range) {
    let i_normalized = (i - range[0]) / (range[1] - range[0])
    let j_normalized = (j - range[0]) / (range[1] - range[0])
    let diff_normalized = Math.abs(i_normalized - j_normalized)
    return diff_normalized
}

function total_range(ranges) {
    let total_range = ranges[0]
    for (let range of ranges) {
        total_range[0] = Math.min(total_range[0], range[0])
        total_range[1] = Math.min(total_range[1], range[1])
    }
    return total_range
}
