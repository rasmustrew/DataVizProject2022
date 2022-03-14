function normalized_diff(i, j, range) {
    let i_normalized = (i - range[0]) / (range[1] - range[0])
    let j_normalized = (j - range[0]) / (range[1] - range[0])
    let diff_normalized = Math.abs(i_normalized - j_normalized)
    return diff_normalized
}

function total_range(ranges) {
    let total_range = []
    total_range[0] = ranges[0][0]
    total_range[1] = ranges[0][1]
    for (let range of ranges) {
        total_range[0] = Math.min(total_range[0], range[0])
        total_range[1] = Math.max(total_range[1], range[1])
    }
    return total_range
}

function norm_screen_data_diff(data, dimension, dimension_ranges, par_coords) {
    let summed_diff = 0;
    let max = 0
    for (let i in data) {
        for (let j = i; j < data.length; j++) {
            let domain_range = total_range(dimension_ranges)
            let data_i = data[i][dimension]
            let data_j = data[j][dimension]
            let data_space_diff = normalized_diff(data_i, data_j, domain_range)

            let screen_i = par_coords.y_position(data_i, dimension)
            let screen_j = par_coords.y_position(data_j, dimension)
            let screen_diff = normalized_diff(screen_i, screen_j, par_coords.screen_range)

            let diff = Math.abs(data_space_diff - screen_diff)
            summed_diff += diff
            max += 1
        }
    }
    return summed_diff / max
}

function normalized_screen_data_space_difference(par_coords) {
    let norm_diff_per_dimension = {}
    for (let dimension of par_coords.dimensions) {
        norm_diff_per_dimension[dimension] = norm_screen_data_diff(par_coords.data, dimension, par_coords.dimension_ranges[dimension], par_coords)
    }
    return norm_diff_per_dimension;
}

function max_diff(data, dimension, par_coords) {
    let max_diff = 0

    let sorted_data = []
    for (let i in data) {
        sorted_data.push(data[i][dimension])
    }
    sorted_data.sort(function (a, b) {
        return a - b;
    });

    for (let i = 0; i < sorted_data.length - 1; i++) {
        let j = i + 1
        let data_i = sorted_data[i]
        let data_j = sorted_data[j]

        let screen_i = par_coords.y_position(data_i, dimension)
        let screen_j = par_coords.y_position(data_j, dimension)
        let norm_diff = normalized_diff(screen_i, screen_j, par_coords.screen_range)
        max_diff = Math.max(max_diff, norm_diff)
    }
    return max_diff
}

function normalized_max_distance_between_points(par_coords) {
    let max_diff_per_dimension = {}
    for (let dimension of par_coords.dimensions) {
        max_diff_per_dimension[dimension] = max_diff(par_coords.data, dimension, par_coords)
    }
    return max_diff_per_dimension;
}

function number_of_splits_per_dimension(par_coords) {
    let num_splits_per_dimension = {}
    for (let dimension of par_coords.dimensions) {
        num_splits_per_dimension[dimension] = par_coords.dimension_ranges[dimension].length
    }
    return num_splits_per_dimension
}

// weights must be equal length to the amount of metrics
export function compute_metrics(par_coords, weights) {
    let norm_diff_per_dimension = normalized_screen_data_space_difference(par_coords);
    let max_dist_per_dimension = normalized_max_distance_between_points(par_coords);
    let num_splits_per_dimension = number_of_splits_per_dimension(par_coords);


    let norm_diff_sum = Object.values(norm_diff_per_dimension).reduce((sum, current) => sum += current);
    let max_dist_sum = Object.values(max_dist_per_dimension).reduce((sum, current) => sum += current);
    let num_splits_sum = Object.values(num_splits_per_dimension).reduce((sum, current) => sum += current);




    let norm_diff_norm = norm_diff_sum / par_coords.dimensions.length
    let max_dist_norm = max_dist_sum / par_coords.dimensions.length
    let num_splits_norm =  num_splits_sum / par_coords.dimensions.length

    let combined = norm_diff_norm * weights[0] + max_dist_norm * weights[1] + num_splits_norm * weights[2];

    return {
        norm_diff_norm,
        max_dist_norm,
        num_splits_norm,
        combined
    }
}