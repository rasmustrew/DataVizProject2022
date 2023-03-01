import ProportionateSplitMapper from "../mappings/proportionate_split_mapping";

let init_map = {
    "random": (sorted_data, k) => lloyds_1d(sorted_data, k, rand_init),
    "++": (sorted_data, k) => lloyds_1d(sorted_data, k, kMeansPlusPlus1D),
    "optimal": optimal_kmeans_1d
}

// In general for kmeans, k = number of clusters
export function kmeans_splits(sorted_data, args, _, version="++") {
    let k = args["clusters"]
    let centers = init_map[version](sorted_data, k)
    let split_points = compute_split_points(sorted_data, centers);
    return new ProportionateSplitMapper(sorted_data, split_points)
}

function compute_split_points(sorted_data, centers) {
    // let clusters = get_clusters(sorted_data, centers)
    // let cluster_starts = [], cluster_ends = []
    // for (const cluster of clusters) {
    //     cluster_starts.push(Math.min(cluster))
    //     cluster_ends.push(Math.max(cluster))
    // }
    let k = centers.length
    let split_points = []
    centers = [...new Set(centers)]
    centers.sort((a, b) => a - b)
    for (let i = 0; i < k - 1; i++) {
        split_points.push(((centers[i + 1] - centers[i]) / 2) + centers[i])
    }
    return split_points.filter(point => !isNaN(point) && point !== Infinity)
}

function get_clustering_from_centers(data, centers) {
    let clustering_assignments = cluster_assigment(data, centers);
    let clusters = new Array(centers.length)
    for (let i = 0; i < centers.length; i++) {
        clusters[i] = []
    }
    for (let i = 0; i < data.length; i++) {
        clusters[clustering_assignments[i]].push(data[i])
    }
    return clusters
}

function cluster_assigment(data, centers) {
    let clustering = new Array(data.length)
    for (let i = 0; i < data.length; i++) {
        let x = data[i]
        clustering[i] = 0
        for (let j = 0; j < centers.length; j++) {
            if (Math.abs(x - centers[j]) < Math.abs(x - centers[clustering[i]])) {
                clustering[i] = j
            }
        }
    }
    return clustering
}

function lloyds_1d(data, k, init_function=kMeansPlusPlus1D, max_iter=10) {
    var centers = init_function(data, k)
    var change_in_centers = true
    var iters = 0
    while (change_in_centers && iters < max_iter) {
        let clustering = cluster_assigment(data, centers)
        let new_centers = Array(k).fill(0)
        let cluster_sizes = Array(k).fill(0)
        for (let i = 0; i < data.length; i++) {
            new_centers[clustering[i]] += data[i]
            cluster_sizes[clustering[i]] += 1
        }
        for (let i = 0; i < k; i++) {
            new_centers[i] = new_centers[i] / cluster_sizes[i]
        }
        let total_center_difference = 0
        for (let i = 0; i < k; i++) {
            total_center_difference += Math.abs(new_centers[i] - centers[i])
        }
        if (total_center_difference < 0.001) {
            change_in_centers = false
        }
        centers = new_centers
        iters++
    }
    return centers
}

function rand_init(sorted_data, k) {
    let centers = []
    let non_picked_values = sorted_data
    for (let i = 0; i < k; i++) {
        const randomInt = Math.floor(Math.random() * sorted_data.length);
        centers.push(sorted_data[randomInt])
        non_picked_values = non_picked_values.filter(item => item !== sorted_data[randomInt])
    }
    return centers
}

// Initialize centers with k-means++ method
function kMeansPlusPlus1D(sorted_data, k) {
    let centers = [sorted_data[Math.floor(Math.random() * sorted_data.length)]];
    for (let i = 1; i < k; i++) {
        let distances = [];
        let totalSquaredDistance = 0;

        // Calculate distances from each point to the closest centroid
        for (let j = 0; j < sorted_data.length; j++) {
            let minDistance = Infinity;
            for (let l = 0; l < centers.length; l++) {
                let distance = Math.abs(sorted_data[j] - centers[l]);
                if (distance < minDistance) {
                    minDistance = distance;
                }
            }
            distances[j] = minDistance;
            totalSquaredDistance += minDistance ** 2;
        }

        // Choose new centroid based on probability proportional to distance squared
        let cumulativeProbability = 0;
        let chosenIndex = -1;
        let randomValue = Math.random();
        for (let j = 0; j < distances.length; j++) {
            cumulativeProbability += distances[j] ** 2 / totalSquaredDistance;
            if (randomValue <= cumulativeProbability) {
                chosenIndex = j;
                break;
            }
        }

        centers.push(sorted_data[chosenIndex]);
    }

    return centers;
}

function mean(points) {
    return points.reduce((a, b) => a + b) / points.length;
}

function single_cluster_cost(points) {
    let center = mean(points);
    // Calculate total squared distance to mean
    return points.reduce((total, point) => total + (point - center) ** 2)
}

// Based on building a dynamic programming table of optimal k-means clustering of n points
// Each cell only depends on the cells to the left of it in the previous row of the table
function optimal_kmeans_1d(sorted_data, k) {
    const n = sorted_data.length
    let cost_table = Array(n).fill(null).map(() => Array(k).fill(0));
    let segment_table = Array(n).fill(null).map(() => Array(k).fill(0));
    // Init first row with 1 cluster error
    for (let i = 1; i <= n; i++) {
        cost_table[0][i] = single_cluster_cost(sorted_data.slice(0, i))
    }
    // Fill tables
    for (let m = 1; m < k; m++) {
        for (let i = m + 1; i < n; i++) {
            let optimal_cost_so_far = Infinity
            let splitting_point = 0
            // Look up cells to the left in the previous row
            for (let j = m; j < i; j++) {
                let optimal_j_points_cost = cost_table[j][m - 1]
                let new_cluster_from_j_to_i_cost = single_cluster_cost(sorted_data.slice(j, i))
                let combined_cost = optimal_j_points_cost + new_cluster_from_j_to_i_cost
                if (combined_cost < optimal_cost_so_far) {
                    optimal_cost_so_far = combined_cost
                    splitting_point = j
                }
            }
            cost_table[i][m] = optimal_cost_so_far
            segment_table[i][m] = splitting_point
        }
    }
    // Construct centers based on reversing through segment table
    let next_segment_start = n
    let centers = []
    for (let m = k - 1; m >= 0; m--) {
        let segment_start = m === 0 ? 0 : segment_table[next_segment_start - 1][m] + 1
        let cluster = sorted_data.slice(segment_start, next_segment_start)
        let center = mean(cluster)
        centers.push(center)
        next_segment_start = segment_start
    }
    return centers
}
