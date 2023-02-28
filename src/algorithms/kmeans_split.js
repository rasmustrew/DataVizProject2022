import ProportionateSplitMapper from "../mappings/proportionate_split_mapping";

export function kmeans_splits(sorted_data, args) {
    let n_clusters = args["clusters"]
    let centers = kmeans1d(sorted_data, n_clusters, rand_init)
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
    split_points = split_points.filter(point => !isNaN(point) && point !== Infinity)
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

function kmeans1d(data, n_clusters, init_function=kMeansPlusPlus1D, max_iter=10) {
    var centers = init_function(data, n_clusters)
    var change_in_centers = true
    var iters = 0
    while (change_in_centers && iters < max_iter) {
        let clustering = cluster_assigment(data, centers)
        let new_centers = Array(n_clusters).fill(0)
        let cluster_sizes = Array(n_clusters).fill(0)
        for (let i = 0; i < data.length; i++) {
            new_centers[clustering[i]] += data[i]
            cluster_sizes[clustering[i]] += 1
        }
        if(cluster_sizes.includes(NaN) || new_centers.includes(NaN)) {
            throw Error()
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
        centers = new_centers
        iters++
    }
    return centers
}

function rand_init(sorted_data, n_clusters) {
    let centers = []
    let non_picked_values = sorted_data
    for (let i = 0; i < n_clusters; i++) {
        const randomInt = Math.floor(Math.random() * sorted_data.length);
        centers.push(sorted_data[randomInt])
        non_picked_values = non_picked_values.filter(item => item !== sorted_data[randomInt])
    }
    return centers
}

//From ChatGPT
function kMeansPlusPlus1D(sorted_data, n_clusters) {
    // Initialize centroids with k-means++ method
    let centroids = [sorted_data[Math.floor(Math.random() * sorted_data.length)]];
    for (let i = 1; i < n_clusters; i++) {
        let distances = [];
        let totalDistance = 0;

        // Calculate distances from each point to the closest centroid
        for (let j = 0; j < sorted_data.length; j++) {
            let minDistance = Infinity;
            for (let l = 0; l < centroids.length; l++) {
                let distance = Math.abs(sorted_data[j] - centroids[l]);
                if (distance < minDistance) {
                    minDistance = distance;
                }
            }
            distances[j] = minDistance;
            totalDistance += minDistance;
        }

        // Choose new centroid based on probability proportional to distance squared
        let cumulativeProbability = 0;
        let chosenIndex = -1;
        let randomValue = Math.random() * totalDistance;
        for (let j = 0; j < distances.length; j++) {
            cumulativeProbability += distances[j] / totalDistance;
            if (randomValue <= cumulativeProbability) {
                chosenIndex = j;
                break;
            }
        }
        centroids.push(sorted_data[chosenIndex]);
    }

    return centroids;
}

