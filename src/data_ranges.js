import {compute_metrics, compute_metrics_dim, compute_total_metric} from "./metrics";

export function simple_ranges(data, dimensions) {
    let range_map = {};
    dimensions.forEach((dimension) => {
        let running_min = parseFloat(data[0][dimension])
        let running_max = parseFloat(data[0][dimension])
        for (let index in data) {
            let data_point = data[index]
            data_point = parseFloat(data_point[dimension])
            running_min = Math.min(data_point, running_min)
            running_max = Math.max(data_point, running_max)
        }
        range_map[dimension] = [[running_min, running_max]]
    });

    return range_map;
}

// Finds data ranges with 0-1 splits by brute force
// Input: (dimensions to alter, simple ranges for all dimensions, par coords initialized with simple ranges)
// Return: (metrics, ranges)
// export function naive_single_split_ranges(dimensions, simple_ranges, previous_dimension, par_coords) {
//     if (dimensions.length === 0) {
//         let cloned_dimensions = [...dimensions]
//         cloned_dimensions.push(previous_dimension)
//         return {
//             metrics: compute_metrics(par_coords, cloned_dimensions),
//             ranges: par_coords.dimension_ranges
//         }
//     }
//
//     let current_dimension = dimensions[0]
//     let simple_range = simple_ranges[current_dimension]
//     console.log("step")
//     let percent_step = (simple_range[1] - simple_range[0]) / 10
//     let best_so_far = naive_single_split_ranges(dimensions.slice(1), simple_ranges, current_dimension, par_coords)
//     for (let i = 1; i < 10; i += 1) {
//         let single_split_ranges = [[simple_range[1], percent_step * i], [percent_step * i, simple_range[0]]]
//         par_coords.update_single_dimension_ranges(current_dimension, single_split_ranges)
//         let current_result = naive_single_split_ranges(dimensions.slice(1), simple_ranges, current_dimension, par_coords)
//         if (current_result.metrics.combined > best_so_far.metrics.combined) {
//             best_so_far = current_result
//         }
//     }
//     return best_so_far
//
// }

export function guided_split(dimensions, simple_ranges, par_coords, weights, suggestions) {
    let computed_ranges = {}
    for (let dimension of dimensions) {
        par_coords.update_single_dimension_ranges(dimension, [...simple_ranges[dimension]])
        let metrics_without_split = compute_metrics(par_coords, weights)
        let current_best_metrics = metrics_without_split
        let current_best_metric = compute_total_metric(metrics_without_split, weights)
        let current_best_split = [...simple_ranges[dimension]]

        for (let suggested_split_pos of suggestions[dimension]) {
            let single_split_ranges = [[simple_ranges[dimension][0][0], suggested_split_pos], [suggested_split_pos, simple_ranges[dimension][0][1]]]
            par_coords.update_single_dimension_ranges(dimension, single_split_ranges)
            let metrics_dim = compute_metrics_dim(par_coords, dimension)
            let current_metrics = {}
            Object.assign(current_metrics, current_best_metrics)
            current_metrics[dimension] = metrics_dim
            let current_metric = compute_total_metric(current_metrics, weights)
            if (current_metric < current_best_metric) {
                current_best_metrics = current_metrics
                current_best_metric = current_metric
                current_best_split = par_coords.dimension_ranges[dimension]
            }
        }

        computed_ranges[dimension] = current_best_split
        par_coords.update_single_dimension_ranges(dimension, [...current_best_split])
    }
    par_coords.set_dimension_ranges(computed_ranges)
    return {
        ranges: computed_ranges,
        metrics: compute_metrics(par_coords, weights)
    }
}

export function naive_multisplit(dimensions, simple_ranges, par_coords, weights) {

    let computed_ranges = {}
    for (let dimension of dimensions) {
        par_coords.update_single_dimension_ranges(dimension, [...simple_ranges[dimension]])
        let metrics_without_split = compute_metrics(par_coords, weights)
        let current_best_metrics = metrics_without_split
        let current_best_metric = compute_total_metric(metrics_without_split, weights)
        let current_best_split = [...simple_ranges[dimension]]
        let split_index = 0
        let working_range = [...simple_ranges[dimension][0]]
        for (let k = 0; k < 5; k++) {
            let has_split = false
            let one_step = (working_range[1] - working_range[0]) / 100
            for (let i = 1; i < 100; i++) {
                let split_pos = working_range[0] + one_step * i
                let single_split_ranges = [[working_range[0], split_pos], [split_pos, working_range[1]]]
                par_coords.update_single_dimension_ranges(dimension, single_split_ranges, split_index, has_split)
                let metrics_dim = compute_metrics_dim(par_coords, dimension)
                let current_metrics = {}
                Object.assign(current_metrics, current_best_metrics)
                current_metrics[dimension] = metrics_dim
                let current_metric = compute_total_metric(current_metrics, weights)
                // if (dimension === "density/stp") {
                //     par_coords.delete()
                //     par_coords.draw()
                // }
                if (current_metric < current_best_metric) {
                    current_best_metrics = current_metrics
                    current_best_metric = current_metric
                    current_best_split = par_coords.dimension_ranges[dimension]

                }
                has_split = true
            }
            let biggest_axis = 0
            let biggest_axis_size = 0
            for (let axis_index = 0; axis_index < current_best_split.length; axis_index++) {
                let axis = current_best_split[axis_index]
                if (axis[1] - axis[0] > biggest_axis_size) {
                    biggest_axis_size = axis[1] - axis[0]
                    biggest_axis = axis_index
                }
            }
            split_index = biggest_axis
            working_range = [...current_best_split[split_index]]
            computed_ranges[dimension] = current_best_split
            par_coords.update_single_dimension_ranges(dimension, [...current_best_split])
        }


    }
    par_coords.set_dimension_ranges(computed_ranges)
    return {
        ranges: computed_ranges,
        metrics: compute_metrics(par_coords, weights)
    }
}

export const hardcoded_numbeo_range = {
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

export const hardcoded_un_range = {
    'Surface area (km2)': [[26, 10000], [10000, 17098246]],
    'Population in thousands (2017)': [[5, 50000], [50000, 1409517]],
    'Population density (per km2, 2017)': [[0.1, 500], [500, 20821.6]],
    'GDP: Gross domestic product (million current US$)': [[33, 1000000], [100000, 18036648]],
    'International trade: Balance (million US$)': [[-796494, -100000], [-100000, 40000], [40000, 530285]],
    'International trade: Exports (million US$)': [[0, 60000], [60000, 2118981]],
    'International trade: Imports (million US$)': [[12, 60000], [60000, 2249661]],
    'GDP growth rate (annual %, const. 2005 prices)': [[-28.1, 0], [0, 10], [10, 26.3]],
    'GDP per capita (current US$)': [[144.5, 10000], [10000, 45000], [45000, 100160.8]]
}

export const hardcoded_animals_range = {
    'Overall Sample Size ': [[0, 850], [850, 1650], [1650, 3406]],
    'Overall MLE': [[2, 22], [22, 47]],
    'Overall CI - lower': [[2, 18], [18, 38]],
    'Overall CI - upper': [[2.5, 20], [20, 53]],
    'Male Sample Size': [[26, 50], [50, 360], [360, 1425]],
    'Male MLE': [[2.5, 19], [19, 51.5]],
    'Male CI - lower': [[2, 18], [18, 41.5]],
    'Male CI - upper': [[2.5, 25], [25, 55]]
}

export const hardcoded_periodic_table_range = {
    'boiling_point': [[4.222, 400], [400, 6203]],
    'abundance/universe': [[8e-9, 8e-7], [8e-7, 8e-5], [8e-5, 8e-3], [8e-3, 8e-1], [8e-1, 75]],
    // 'abundance/universe': [[8e-9, 0.1], [0.1, 75]],
    'conductivity/thermal': [[0.00565, 1], [1, 250], [250, 430]],
    // 'density/stp': [[0.0899, 5], [5, 22590]],
    // 'density/stp': [[0.0899, 225], [225, 22590]],
    'density/stp': [[0.0899, 2.25], [2.25, 22590]],
    'ionization_energies/0': [[357.7, 2372.3]],
    'melting_point': [[0.95, 100], [100, 3823]],
    'electron_affinity': [[-116, 348.575]],
    'discovered/year': [[-8000, 1650], [1650, 1925]]
}