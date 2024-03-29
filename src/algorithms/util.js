export function k_random_values(sorted_data, k) {
    let centers = []
    let non_picked_values = sorted_data
    for (let i = 0; i < k; i++) {
        const randomInt = Math.floor(Math.random() * sorted_data.length);
        centers.push(sorted_data[randomInt])
        non_picked_values = non_picked_values.filter(item => item !== sorted_data[randomInt])
    }
    return centers
}

export function k_random_integers(n, k) {
    return k_random_values(zero_to_n(n), k)
}

export function zero_to_n(n) {
    return Array.from(Array(n).keys())
}

export function mean(points) {
    return points.reduce(sum, 0) / points.length;
}

export function sum(x1, x2) {
    return x1 + x2
}

export function nlgn(n) {
    if (n === 0) return 0
    return n * Math.log2(n)
}

export function make_histogram(bins, sorted_data) {
    const range = [sorted_data[0], sorted_data[sorted_data.length - 1]]
    const bin_size = (range[1] - range[0]) / bins
    let histogram = []
    let i = 0
    for (let k = 1; k <= bins; k++) {
        let bin_elements = 0
        const bin_end = range[0] + (k * bin_size)
        while (sorted_data[i] <= bin_end && i < sorted_data.length) {
            bin_elements++
            i++
        }
        histogram.push(bin_elements)
    }
    if (sorted_data.length !== histogram.reduce(sum, 0)) {
        histogram[bins - 1]++
    }
    return histogram;
}

export function entropy(sorted_data, mapper, avg_bin = 3) {
    const mapped_data = sorted_data.map(x => mapper.map(x))
    const distribution = get_data_distribution(mapped_data, avg_bin)
    const negative_entropy = distribution.map(p => nlgn(p)).reduce(sum)
    return -negative_entropy
}

export function get_data_distribution(sorted_data, avg_bin = 3) {
    const n = sorted_data.length
    const bins = Math.floor(n / avg_bin)
    const hist = make_histogram(bins, sorted_data)
    return hist.map(count => count / n)
}

function kl_divergence(p, q) {
    return zero_to_n(p.length)
        .map(i => p[i] * Math.log(p[i] / q[i]))
        .reduce(sum, 0);
}

export function mapper_kl_divergence(sorted_data, mapper, avg_bin = 10) {
    const distribution = get_data_distribution(sorted_data, avg_bin)
    const mapped_data = sorted_data.map(x => mapper.map(x))
    const mapped_distribution = get_data_distribution(mapped_data, avg_bin)
    return kl_divergence(distribution, mapped_distribution)
}

export function data_range(sorted_data) {
    return [sorted_data[0], sorted_data[sorted_data.length - 1]]
}
