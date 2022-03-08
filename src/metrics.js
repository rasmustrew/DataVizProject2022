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

function normalized_screen_data_space_difference(dimensions, data, dimension_ranges, par_coords, screen_range) {
    let norm_diff_per_dimension = {}
    for (let dimension of dimensions) {
        let summed_diff = 0;
        let max = 0
        for (let i in data) {
            for (let j = i; j < data.length; j++) {
                let domain_range = total_range(dimension_ranges[dimension])
                let data_i = data[i][dimension]
                let data_j = data[j][dimension]
                let data_space_diff = normalized_diff(data_i, data_j, domain_range)

                let screen_i = par_coords.y_position(data_i, dimension)
                let screen_j = par_coords.y_position(data_j, dimension)
                let screen_diff = normalized_diff(screen_i, screen_j, screen_range)

                let diff = Math.abs(data_space_diff - screen_diff)
                summed_diff += diff
                max += 1
            }
        }
        norm_diff_per_dimension[dimension] = summed_diff / max
    }
    return norm_diff_per_dimension;
}

function normalized_max_distance_between_points(dimensions, data, par_coords, screen_range) {
    let max_diff_per_dimension = {}
    for (let dimension of dimensions) {
        max_diff_per_dimension[dimension] = 0;

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
            let norm_diff = normalized_diff(screen_i, screen_j, screen_range)
            max_diff_per_dimension[dimension] = Math.max(max_diff_per_dimension[dimension], norm_diff)
        }
    }
    return max_diff_per_dimension;
}

// weights must be equal length to the amount of metrics
export function compute_metrics(par_coords) {
    let data = par_coords.data
    let dimensions = par_coords.dimensions
    let dimension_ranges = par_coords.dimension_ranges
    let screen_range = par_coords.screen_range

    let norm_diff_per_dimension = normalized_screen_data_space_difference(dimensions, data, dimension_ranges, par_coords, screen_range);
    let max_dist_per_dimension = normalized_max_distance_between_points(dimensions, data, par_coords, screen_range);


    let norm_diff_sum = Object.values(norm_diff_per_dimension).reduce((sum, current) => sum += current);
    let max_dist_sum = Object.values(max_dist_per_dimension).reduce((sum, current) => sum += current);

    let combined = norm_diff_sum * 1 + max_dist_sum * 1;

    let norm_diff_norm = norm_diff_sum / dimensions.length
    let max_dist_norm = max_dist_sum / dimensions.length
    return {
        norm_diff_norm,
        max_dist_norm,
        combined
    }
}