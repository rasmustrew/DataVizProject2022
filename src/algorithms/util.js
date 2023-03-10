

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
    return k_random_values(one_to_n(n), k)
}

export function one_to_n(n) {
    return Array.from(Array(n).keys())
}

export function mean(points) {
    return points.reduce(sum, 0) / points.length;
}

export function sum(x1, x2) {
    return x1 + x2
}

export function nlgn(n) {
    return n * Math.log2(n)
}