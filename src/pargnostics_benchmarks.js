let binning_size = 5

export function screen_histogram_2d(par_coords) {
    let height = Math.floor(par_coords.height/binning_size) + 1

    let histograms_2d = {}

    for (let i = 0; i <= par_coords.dimensions.length - 2; i++) {
        let current_histogram = new Array(height)
        for (let i = 0; i < current_histogram.length; i++) {
            current_histogram[i] = new Array(height).fill(0)
        }
        let dimension_left = par_coords.dimensions[i]
        let dimension_right = par_coords.dimensions[i+1]

        for (let data_point of par_coords.data) {
            let y_coordinate_left = Math.floor(par_coords.y_position(data_point[dimension_left], dimension_left) / binning_size)
            let y_coordinate_right = Math.floor(par_coords.y_position(data_point[dimension_right], dimension_right) / binning_size)

            y_coordinate_left = Math.max(y_coordinate_left, 0)
            y_coordinate_right = Math.max(y_coordinate_right, 0)
            current_histogram[y_coordinate_left][y_coordinate_right] += 1
        }
        histograms_2d[dimension_left] = current_histogram
    }
    return histograms_2d
}

export function screen_histogram_1d(par_coords) {
    let height = Math.floor(par_coords.height/binning_size) + 1

    let histograms_1d = {}

    for (let dimension of par_coords.dimensions) {
        let current_histogram = new Array(height).fill(0)

        for (let data_point of par_coords.data) {
            let y_coordinate = Math.floor(par_coords.y_position(data_point[dimension], dimension) / binning_size)

            y_coordinate= Math.max(y_coordinate, 0)
            current_histogram[y_coordinate] += 1
        }
        histograms_1d[dimension] = current_histogram
    }
    return histograms_1d
}

export function number_of_line_crossings(par_coords) {

    let line_crossings = {}
    let crossing_angles = {}



    for (let i = 0; i < par_coords.dimensions.length - 1; i++) {
        let number_of_line_crossings = 0

        let dim_left = par_coords.dimensions[i]
        let dim_right = par_coords.dimensions[i+1]
        let crossing_angles_histogram = new Array(91).fill(0)

        for (let data_point_i of par_coords.data) {
            let x_l = Math.round(par_coords.x(dim_left))
            let x_r = Math.round(par_coords.x(dim_right))
            let i_y_l = binning_size * Math.round(par_coords.y_position(data_point_i[dim_left], dim_left) / binning_size)
            let i_y_r = binning_size * Math.round(par_coords.y_position(data_point_i[dim_right], dim_right) / binning_size)

            let i_a = (i_y_l - i_y_r) / (x_l - x_r)
            let i_b = i_y_l - i_a * x_l

            for (let data_point_j of par_coords.data) {
                let j_y_l = binning_size * Math.round(par_coords.y_position(data_point_j[dim_left], dim_left) / binning_size)
                let j_y_r = binning_size * Math.round(par_coords.y_position(data_point_j[dim_right], dim_right) / binning_size)

                let j_a = (j_y_l - j_y_r) / (x_l - x_r)
                let j_b = j_y_l - j_a * x_l

                if (i_a - j_a === 0) {
                    continue
                }
                let intersect_x = (j_b - i_b) / (i_a - j_a)
                let intersect_y = j_a * intersect_x + j_b

                if (((i_y_l >= j_y_l) && (i_y_r >= j_y_r)) || ((j_y_l >= i_y_l) && (j_y_r >= i_y_r))) {
                } else {
                    number_of_line_crossings += 1
                    let crossing_angle = Math.abs(Math.atan((i_a - j_a)/(1 + i_a * j_a)) * (180/Math.PI))

                    if (crossing_angle > 90) {
                        crossing_angle = 180 - crossing_angle
                    }
                    crossing_angle = Math.round(crossing_angle)
                    crossing_angles_histogram[crossing_angle] += 1
                }
            }
        }

        let running_sum = 0
        let median_index
        for (let index in crossing_angles_histogram) {
            running_sum += crossing_angles_histogram[index]
            if (running_sum >= number_of_line_crossings / 2) {
                median_index = index
                break
            }
        }

        let running_angle_sum = 0
        let running_count = 0
        for (let index in crossing_angles_histogram) {
            running_angle_sum += index * crossing_angles_histogram[index]
            running_count += crossing_angles_histogram[index]
        }
        let running_angle_mean = running_angle_sum

        // crossing_angles[dim_left] = Math.round(running_angle_mean / running_count)
        crossing_angles[dim_left] = median_index

        line_crossings[dim_left] = number_of_line_crossings / 2
    }
    return {
        crossing_angles,
        line_crossings,
    }
}


export function overplotting_2d(histograms_2d) {
    let overplottings = {}

    for (let dimension of Object.keys(histograms_2d)) {
        let histogram = histograms_2d[dimension]
        let overplotting = 0

        for (let i = 0; i < histogram.length; i++) {
            for (let j = 0; j < histogram.length; j++) {
                if (histogram[i][j] > 1) {
                    overplotting += histogram[i][j]
                }
            }
        }
        overplottings[dimension] = overplotting
    }
    return overplottings
}

export function overplotting_1d(histograms_1d) {
    let overplottings = {}

    for (let dimension of Object.keys(histograms_1d)) {
        let histogram = histograms_1d[dimension]
        let overplotting = 0

        for (let i = 0; i < histogram.length; i++) {
            if (histogram[i] > 1) {
                overplotting += histogram[i]
            }
        }
        overplottings[dimension] = overplotting
    }
    return overplottings
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


export function pretty_print_benchmarks(par_coords) {
    let screen_histograms_1d = screen_histogram_1d(par_coords)
    let screen_histograms_2d = screen_histogram_2d(par_coords)
    let crossings = number_of_line_crossings(par_coords)
    let line_crossings = crossings.line_crossings
    let crossing_angles = crossings.crossing_angles
    let overplottings_1d = overplotting_1d(screen_histograms_1d)
    let overplottings_2d = overplotting_2d(screen_histograms_2d)
    // let convergences = convergence(screen_histograms_2d)


    pretty_print_benchmark(line_crossings)
    pretty_print_benchmark(overplottings_2d)
    // pretty_print_benchmark(convergences)
    pretty_print_benchmark(crossing_angles)
    pretty_print_benchmark(overplottings_1d)
}

export function pretty_print_benchmark(benchmark) {
    let string = ""
    for (let value of Object.values(benchmark)) {
        string += value + ", "
    }
    console.log(string)
}