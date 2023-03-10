import {kmeans_splits} from "./kmeans_split";
import ProportionateSplitMapper from "../mappings/proportionate_split_mapping";
import {k_random_integers, k_random_values, mean, nlgn, one_to_n, sum} from "./util";

let init_map = {
    random: (sorted_data, n_segments) => k_random_values(sorted_data, n_segments - 1),
    kmeans: (sorted_data, n_segments) => kmeans_splits(sorted_data, { clusters: n_segments }, null, "optimal").split_points
};

export function MIL_splits(sorted_data, args, _, version = "kmeajsns") {
    const n_clusters = args["clusters"];
    let algorithm = init_map[version];
    const initial_splits = algorithm(sorted_data, n_clusters);
    let surprise_split = new SurpriseSplit();
    const splits = surprise_split.min_information_loss(sorted_data, n_clusters, initial_splits);
    return new ProportionateSplitMapper(sorted_data, splits);
}

class SurpriseSplit {

    min_information_loss(sorted_data, n_segments, initial_splits) {
        const n_splits = n_segments - 1;
        let split_indices = this.splits_to_indexes_of_next_point(sorted_data, initial_splits.sort((i1, i2) => i1 - i2));

        const total_data_mass = sorted_data.reduce(sum);
        // Initial entropy contribution of segments
        let entropy_contributions = [];
        for (let k = 0; k < n_segments; k++) {
            const segment_start = k === 0 ? 0 : split_indices[k - 1];
            const segment_end = k === n_segments - 1 ? sorted_data.length : split_indices[k];
            const segment = sorted_data.slice(segment_start, segment_end)
            const entropy_contribution = this.entropy_contribution(segment, total_data_mass)
            entropy_contributions.push(entropy_contribution);
        }
        // Loop until no improvement is made
        let split_changed = true;
        while (split_changed) {
            split_changed = false;
            for (let k = 0; k < n_splits; k++) {
                // Indices into the data array
                const segment1_start = k === 0 ? 0 : split_indices[k - 1];
                const split_index = split_indices[k];
                const segment2_end = k === n_splits ? sorted_data.length : split_indices[k + 1];

                // Compute entropy of 3 cases
                // For entropy of non-affected segments use precomputed values
                const stay_entropy = entropy_contributions.reduce(sum);
                const affected_segments = [k, k + 1]
                const entropy_of_non_affected_segments = one_to_n(n_segments)
                    .filter((i) => !(affected_segments.includes(i)))
                    .map((i) => entropy_contributions[i])
                    .reduce(sum, 0);

                // Moving split point left
                let move_left_entropy = -1;
                let move_left_segment1_entropy = 0;
                let move_left_segment2_entropy = 0;
                // If left segment has only one point we cannot move split point left
                if (split_index - segment1_start > 1) {
                    const segment1 = sorted_data.slice(segment1_start, split_index - 1);
                    move_left_segment1_entropy = this.entropy_contribution(segment1, total_data_mass);
                    const segment2 = sorted_data.slice(split_index - 1, segment2_end);
                    move_left_segment2_entropy = this.entropy_contribution(segment2, total_data_mass);
                    move_left_entropy = move_left_segment1_entropy + move_left_segment2_entropy + entropy_of_non_affected_segments;
                }

                // Moving split point right
                let move_right_entropy = -1;
                let move_right_segment1_entropy = 0;
                let move_right_segment2_entropy = 0;
                // If right segment has only one point we cannot move split point right
                if (segment2_end - split_index > 1) {
                    const segment1 = sorted_data.slice(segment1_start, split_index + 1);
                    move_right_segment1_entropy = this.entropy_contribution(segment1, total_data_mass);
                    const segment2 = sorted_data.slice(split_index + 1, segment2_end);
                    move_right_segment2_entropy = this.entropy_contribution(segment2, total_data_mass);
                    move_right_entropy = move_right_segment1_entropy + move_right_segment2_entropy + entropy_of_non_affected_segments;
                }

                // Choose the split point with the highest entropy and update precalculated values to fit the new segmentation
                const best_entropy = Math.max(move_left_entropy, stay_entropy, move_right_entropy);
                if (best_entropy === move_left_entropy) {
                    split_changed = true;
                    entropy_contributions[k] = move_left_segment1_entropy;
                    entropy_contributions[k + 1] = move_left_segment2_entropy;
                    split_indices[k]--;
                } else if (best_entropy === move_right_entropy) {
                    split_changed = true;
                    entropy_contributions[k] = move_right_segment1_entropy;
                    entropy_contributions[k + 1] = move_right_segment2_entropy;
                    split_indices[k]++;
                }
                console.log(best_entropy)
            }
        }
        return split_indices.map((i) => sorted_data[i]);
    }

    splits_to_indexes_of_next_point(sorted_data, initial_splits) {
        let split_no = 0;
        let split_indices = [];
        for (let i = 0; i < sorted_data.length; i++) {
            if (sorted_data[i] > initial_splits[split_no]) {
                split_indices.push(i);
                split_no += 1;
            }
        }
        if (split_indices.length < initial_splits.length) {
            split_indices.push(sorted_data.length - 1)
        }
        return split_indices;
    }

    // Computes entropy of a dataset when the values are perceived as probabilities
    data_entropy(sorted_data, total_data_mass) {
        // Transform point values to probability mass
        const p_x = sorted_data.map((x) => x / total_data_mass);
        // Original level of entropy in the non segmented data
        return -p_x.map(nlgn).reduce(sum);
    }

    // Computes contribution of single segment towards the entropy of the full dataset
    entropy_contribution(segment, total_data_mass) {
        const segment_size = segment.length;
        const segment_mass = segment.reduce(sum);
        const segment_mean_mass = segment_mass / segment_size
        return -segment_mass / total_data_mass * Math.log2(segment_mean_mass / total_data_mass);
    }
}
