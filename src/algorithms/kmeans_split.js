import ProportionateSplitMapper from "../mappings/proportionate_split_mapping";

export function kmeans_splits(sorted_data, args, ) {
    let n_clusters = args["clusters"]
    let centers = kmeans1d(sorted_data, n_clusters)
    let clusters = get_clusters(sorted_data, centers)
    let cluster_starts = [], cluster_ends = []
    for (const cluster of clusters) {
        cluster_starts.push(Math.min(cluster))
        cluster_ends.push(Math.max(cluster))
    }
    let split_points = []
    centers.sort()
    for (let i = 0; i < n_clusters - 1; i++) {
        split_points.push(((centers[i] - centers[i + 1]) / 2) + centers[i])
    }
    return new ProportionateSplitMapper(sorted_data, split_points)
}

function get_clusters(data, centers) {
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

function kmeans1d(data, n_clusters, init_function=rand_init, max_iter=10) {
    var centers = init_function(data, n_clusters)
    var change_in_centers = true
    var iters = 0
    while (change_in_centers && iters < max_iter) {
        let clustering = cluster_assigment(data, centers)
        let new_centers = new Array(n_clusters)
        let cluster_sizes = new Array(n_clusters)
        for (let i = 0; i < data.length; i++) {
            new_centers[clustering[i]] += data[i]
            cluster_sizes[clustering[i]] += 1
        }
        for (let i = 0; i < n_clusters; i++) {
            new_centers[i] = new_centers[i] / cluster_sizes[i]
        }
        let total_center_difference = 0
        for (let i = 0; i < n_clusters; i++) {
            total_center_difference += Math.abs(new_centers[i] - centers[i])
        }
        if (total_center_difference < 0.001) {
            change_in_centers = false
        }
        iters++
    }
    return centers
}

function rand_init(sorted_data, clusters) {
    let min_val = sorted_data[0]
    let max_val = sorted_data[sorted_data.length - 1]
    let interval_size = max_val - min_val
    let centers = []
    for (let i = 0; i < clusters; i++) {
        centers.push(Math.random() * interval_size + min_val)
    }
    return centers
}
