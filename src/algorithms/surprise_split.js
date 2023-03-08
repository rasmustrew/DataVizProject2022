import {kmeans_splits, rand_init} from "./kmeans_split";


let init_map = {
    "random": (sorted_data, n_segments) => rand_init(sorted_data, n_segments - 1),
    "kmeans": (sorted_data, n_segments) => {
        const mapper = kmeans_splits(sorted_data, {"clusters": n_segments}, null, "optimal")
        min_information_loss(sorted_data, n_segments, mapper.split_points)
    }
}

export function MIL_splits(sorted_data, args, _, version = "kmeans") {
    const n_clusters = args["clusters"]
    const initial_splits = init_map[version]()
    min_information_loss(initial_splits)
    return []
}


function min_information_loss(sorted_data, n_segments, initial_splits) {
    const n_splits = n_segments - 1

}