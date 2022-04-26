
export function screen_histogram_2d(par_coords) {
    let height = par_coords.height + 1

    let histograms_2d = {}

    for (let i = 0; i <= par_coords.dimensions.length - 2; i++) {
        let current_histogram = new Array(height)
        for (let i = 0; i < current_histogram.length; i++) {
            current_histogram[i] = new Array(height).fill(0)
        }
        let dimension_left = par_coords.dimensions[i]
        let dimension_right = par_coords.dimensions[i+1]

        for (let data_point of par_coords.data) {
            let y_coordinate_left = Math.floor(par_coords.y_position(data_point[dimension_left], dimension_left))
            let y_coordinate_right = Math.floor(par_coords.y_position(data_point[dimension_right], dimension_right))

            y_coordinate_left = Math.max(y_coordinate_left, 0)
            y_coordinate_right = Math.max(y_coordinate_right, 0)
            current_histogram[y_coordinate_left][y_coordinate_right] += 1
        }
        histograms_2d[dimension_left] = current_histogram
    }
    return histograms_2d
}

export function number_of_line_crossings(histograms_2d) {

    let line_crossings = {}

    for (let dimension of Object.keys(histograms_2d)) {
        let histogram = histograms_2d[dimension]
        let number_of_line_crossings = 0

        for (let i = 0; i < histogram.length; i++) {
            for (let j = 0; j < histogram.length; j++) {
                let b_ij = histogram[i][j]
                for (let k = i+1; k < histogram.length; k++) {
                    for (let l = j+1; l < histogram.length; l++) {
                        let b_kl = histogram[k][l]
                        number_of_line_crossings += b_ij * b_kl
                    }
                }
            }
        }
        line_crossings[dimension] = number_of_line_crossings
    }
    return line_crossings
}

export function overplotting(histograms_2d) {
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

export function compute_benchmarks(par_coords) {
    let screen_histogram = screen_histogram_2d(par_coords)
    let line_crossings = number_of_line_crossings(screen_histogram)
    let overplottings = overplotting(screen_histogram)
    let convergences = convergence(screen_histogram)
    let divergences = divergence(screen_histogram)

}