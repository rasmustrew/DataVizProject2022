import LinearMapper from "../mappings/linear_mapping";

export function screen_histogram_2d(raw_data_a, raw_data_b, mapper_a, mapper_b, num_bins_a, num_bins_b) {
    let bin_size_a = 1 / (num_bins_a - 1)
    let bin_size_b = 1 / (num_bins_b - 1)

    let histogram_2d = new Array(num_bins_a)
    for (let i = 0; i < num_bins_a; i++) {
        histogram_2d[i] = new Array(num_bins_b).fill(0)
    }

    // console.log(num_bins_a, num_bins_b)
    // console.log(mapper_a)
    // console.log(mapper_a.get_input_space_ranges())
    // console.log(mapper_a.get_output_space_ranges())

    for (let i = 0; i < raw_data_a.length; i++) {

        let mapped_point_a = mapper_a.map(raw_data_a[i])
        let mapped_point_b = mapper_b.map(raw_data_b[i])
        let bin_a = Math.floor(mapped_point_a / bin_size_a)
        let bin_b = Math.floor(mapped_point_b / bin_size_b)
        // console.log(raw_data_a[i])
        // console.log(mapped_point_a, bin_a)
        // console.log(mapped_point_b, bin_b)
        // console.log(bin_a, bin_b)
        histogram_2d[bin_a][bin_b] += 1

    }
    return histogram_2d
}

// mapper (0 to 1 output), num_bins
export function screen_histogram_1d(raw_data, mapper, num_bins) {
    let bin_size = 1 / (num_bins - 1)

    let histogram_1d = new Array(num_bins).fill(0)

    for (let data_point of raw_data) {
        let mapped_point = mapper.map(data_point)
        let bin = Math.floor(mapped_point / bin_size)
        histogram_1d[bin] += 1

    }
    return histogram_1d
}

// a is left, b is right, x_distance is in percent of y_distance
export function line_crossings(raw_data_a, raw_data_b, mapper_a, mapper_b, x_distance) {


    let number_of_line_crossings = 0
    let crossing_angles_sum = 0

    for (let i = 0; i< raw_data_a.length; i++) {
        let mapped_point_a_i = mapper_a.map(raw_data_a[i])
        let mapped_point_b_i = mapper_b.map(raw_data_b[i])
        let i_a = (mapped_point_a_i - mapped_point_b_i) / x_distance

        for (let j = i+1; j < raw_data_a.length; j++) {
            let mapped_point_a_j = mapper_a.map(raw_data_a[j])
            let mapped_point_b_j = mapper_b.map(raw_data_b[j])
            let j_a = (mapped_point_a_j - mapped_point_b_j) / x_distance

            let is_crossing_one_way = ((mapped_point_a_i > mapped_point_a_j) && (mapped_point_b_i < mapped_point_b_j))
            let is_crossing_other_way = ((mapped_point_a_i < mapped_point_a_j) && (mapped_point_b_i > mapped_point_b_j))
            let is_crossing_within_vis = is_crossing_one_way || is_crossing_other_way

            if (!is_crossing_within_vis) {
                continue
            }
            number_of_line_crossings += 1
            let crossing_angle = Math.abs(Math.atan((i_a - j_a)/(1 + i_a * j_a)) * (180/Math.PI))
            if (crossing_angle > 90) {
                crossing_angle = 180 - crossing_angle
            }
            crossing_angles_sum += crossing_angle
        }
    }
    let avg_crossing_angle = crossing_angles_sum / number_of_line_crossings
    return {
        avg_crossing_angle,
        number_of_line_crossings,
    }
}


export function overplotting_2d(histogram_2d) {
    let overplotting = 0
    for (let i = 0; i < histogram_2d.length; i++) {
        for (let j = 0; j < histogram_2d.length; j++) {
            if (histogram_2d[i][j] > 1) {
                overplotting += histogram_2d[i][j] - 1
            }
        }

    }
    return overplotting
}

export function overplotting_1d(histogram_1d) {
    let overplotting = 0
    for (let bin of histogram_1d) {
        if (bin > 1) {
            overplotting += bin - 1
        }
    }
    return overplotting
}

export function distortion(raw_data, mapper) {
    raw_data = [...raw_data]
    raw_data.sort((a, b) => a - b)
    let raw_mapper = new LinearMapper([[raw_data[0], raw_data[raw_data.length - 1]]], [0, 1])

    let distort = raw_data.reduce((acc, val) => {
        let raw_mapped = raw_mapper.map(val)
        let mapped = mapper.map(val)
        let distance = Math.abs(raw_mapped - mapped)
        return distance + acc
    }, 0)
    return distort
}

export function convergence(histograms_2d) {
    let convergences = {}

    for (let dimension of Object.keys(histograms_2d)) {
        let histogram = histograms_2d[dimension]
        let convergence = 0

        for (let i = 0; i < histogram.length; i++) {
            for (let j = 0; j < histogram.length; j++) {
                if (histogram[i][j] > 0) {
                    convergence += 1
                }
            }
        }
        convergences[dimension] = convergence
    }
    return convergences
}

export function divergence(histograms_2d) {
    let divergences = {}

    for (let dimension of Object.keys(histograms_2d)) {
        let histogram = histograms_2d[dimension]
        let divergence = 0

        for (let i = 0; i < histogram.length; i++) {
            for (let j = 0; j < histogram.length; j++) {
                if (histogram[j][i] > 0) {
                    divergence += 1
                }
            }
        }
        divergences[dimension] = divergence
    }
    return divergences
}


export function pretty_print_benchmark(benchmark) {
    let string = ""
    for (let value of Object.values(benchmark)) {
        string += value + ", "
    }
    // console.log(string)
}

