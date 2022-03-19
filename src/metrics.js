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
            let domain_range = total_range(dimension_ranges[dimension])
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


export function compute_metrics_dim(par_coords, dim) {
    let norm_diff = norm_screen_data_diff(par_coords.data, dim, par_coords.dimension_ranges, par_coords)
    let max_dist = max_diff(par_coords.data, dim, par_coords)
    let num_splits = par_coords.dimension_ranges[dim].length

    return {
        norm_diff,
        max_dist,
        num_splits
    }
}

// weights must be equal length to the amount of metrics
export function compute_metrics(par_coords) {
    let dimensions_metrics = {}
    for (let dim of par_coords.dimensions) {
        dimensions_metrics[dim] = compute_metrics_dim(par_coords, dim)
    }
    return dimensions_metrics
}

export function compute_total_metric(metrics, weights) {
    let total = 0;
    for (let dim_metric of Object.values(metrics)) {
        for (let metric of Object.keys(dim_metric)) {
            total += dim_metric[metric] * weights[metric]
        }
    }

    return total / Object.values(metrics).length

}