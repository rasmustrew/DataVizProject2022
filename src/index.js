import {load_data} from "./load_numbeo_data";
import ParallelCoordinates from "./parallel_coordinates";
import {basic_ranges} from "./basic_ranges";
import {compute_metrics, normalized_diff, total_range} from "./metrics";

console.log("starting")
load_data().then((data) => {
    console.log(data)
    let _indices_ranges = basic_ranges(data.data, data.dimensions)
    var dimension_ranges = {
        'crime_index': [[0, 100]],
        'traffic_index': [[0, 320]],//unbounded max
        // 'rent_index': [[0, 101]],
        'rent_index': [[0, 20], [20, 101]],
        'groceries_index': [[0, 150]],//unbounded max, 100 is new york
        'restaurant_price_index': [[0, 170]],//unbounded max, 100 is new york
        'pollution_index': [[0, 100]],//actual values seem to be going to 113?
        'health_care_index': [[0, 100]],
        'quality_of_life_index': [[0, 200]],//unbounded
    }
    let par_coords = new ParallelCoordinates(data.data, data.dimensions, dimension_ranges);

    compute_metrics(par_coords)

    par_coords.draw()
})

