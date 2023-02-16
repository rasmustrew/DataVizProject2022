
// We are doing bottom up / agglomerative clustering
export function compute_split_candidates_hierarchial_clustering(data, dimensions, linkage) {
    let splits = {}
    for (let dimension of dimensions) {
        // console.log(dimension)
        let dimension_data = data.map((data_point) => data_point[dimension])
        let clusters = dimension_data.map((data_point) => {
            return {
                values: [data_point]
            }
        })

        while (clusters.length > 1) {
            clusters = dendrogram_step(clusters, linkage)
        }
        let dendrogram = clusters[0];
        let split_points = get_split_points_from_dendrogram(dendrogram)
        // console.log(dimension, dendrogram, split_points)
        splits[dimension] = split_points
    }
    return splits
}

function get_split_points_from_dendrogram(dendrogram) {
    // Use min and maxof both sides as potential split points
    // This will create many duplicates, but we remove those later.

    if (dendrogram === undefined) {
        return []
    }

    // console.log(dendrogram)

    let split_points = [
        Math.max(...dendrogram.values),
        Math.min(...dendrogram.values),
    ]

    let left_split_points = get_split_points_from_dendrogram(dendrogram.left);
    let right_split_points = get_split_points_from_dendrogram(dendrogram.right);

    let all_split_points = [...split_points, ...left_split_points, ...right_split_points];
    all_split_points = all_split_points.filter((item, index) => all_split_points.indexOf(item) === index)
    return all_split_points
}

// Takes top level clusters and
function dendrogram_step(clusters, linkage) {
    let best_linkage_i = 0;
    let best_linkage_j = 1;
    let best_linkage = linkage(clusters[best_linkage_i], clusters[best_linkage_j]);
    for (let i = 0; i < clusters.length - 1; i++) {
        for (let j = i+1; j < clusters.length; j++) {
            let computed_linkage = linkage(clusters[i], clusters[j])
            if (computed_linkage < best_linkage) {
                best_linkage_i = i;
                best_linkage_j = j;
                best_linkage = computed_linkage;
            }
        }
    }

    let cluster_left = clusters[best_linkage_i];
    let cluster_right = clusters[best_linkage_j]
    let combined_cluster = {
        left: cluster_left,
        right: cluster_right,
        values: [...cluster_left.values, ...cluster_right.values],
    };

    //j first because i is smaller, then index of i is not affected by deleting j.
    clusters.splice(best_linkage_j, 1)
    clusters.splice(best_linkage_i, 1)
    return [...clusters, combined_cluster]
}

export function single_linkage(cluster1, cluster2) {
    let smallest_distance = Math.abs(cluster1.values[0] - cluster2.values[0])
    for (let i = 0; i < cluster1.length; i++) {
        for (let j = 0; j < cluster2.length; j++) {
            let distance = Math.abs(cluster1.values[i] - cluster2.values[j])
            if (distance < smallest_distance) {
                smallest_distance = distance;
            }
        }
    }
    return smallest_distance
}

export function complete_linkage(cluster1, cluster2) {
    let largest_distance = Math.abs(cluster1.values[0] - cluster2.values[0])
    for (let i = 0; i < cluster1.length; i++) {
        for (let j = 0; j < cluster2.length; j++) {
            let distance = Math.abs(cluster1.values[i] - cluster2.values[j])
            if (distance > largest_distance) {
                largest_distance = distance;
            }
        }
    }
    return largest_distance
}