import {kmeans_splits} from "./kmeans_split";
import ProportionateSplitMapper from "../mappings/proportionate_split_mapping";
import {k_random_items, nlgn, one_to_n, sum} from "./util";

let init_map = {
    random: (sorted_data, n_segments) => k_random_items(sorted_data, n_segments - 1),
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
    init_map = {
        random: (sorted_data, n_segments) => k_random_items(sorted_data, n_segments - 1),
        kmeans: (sorted_data, n_segments) => {
            const mapper = kmeans_splits(sorted_data, { clusters: n_segments }, null, "optimal");
            min_information_loss(sorted_data, n_segments, mapper.split_points);
        },
    };

    MIL_splits(sorted_data, args, _, version = "kmeajsns") {
        const n_clusters = args["clusters"];
        let algorithm = init_map[version];
        const initial_splits = algorithm(sorted_data, n_clusters);
        const splits = min_information_loss(sorted_data, n_clusters, initial_splits);
        return new ProportionateSplitMapper(sorted_data, splits);
    }

    min_information_loss(sorted_data, n_segments, initial_splits) {
        const n_splits = n_segments - 1;
        initial_splits = initial_splits.sort();
        let split_no = 0;
        let split_indices = [];
        for (let i = 0; i < sorted_data.length; i++) {
            const x = sorted_data[i];
            if (x >= initial_splits[split_no]) {
                split_indices.push(i);
                split_no += 1;
            }
        }

        const total_data_mass = sorted_data.reduce(sum);
        // Transform point values to probability mass
        const p_x = sorted_data.map((x) => x / total_data_mass);
        // Original level of entropy in the non segmented data
        const original_entropy = p_x.map((p_i) => p_i * Math.log2(p_i)).reduce(sum);
        // Initial entropy contribution of segments
        const q = this.compute_segment_probabilities(sorted_data, split_indices, total_data_mass);
        let entropy_contributions = [];
        for (let k = 0; k < n_segments; k++) {
            const segment_start = k === 0 ? 0 : split_indices[k - 1];
            const segment_end = k === n_segments - 1 ? sorted_data.length : split_indices[k];
            const segment_size = segment_end - segment_start;
            entropy_contributions.push(segment_size * -nlgn(q[k]));
        }
        // Loop until no improvement is made
        let split_changed = true;
        while (split_changed) {
            split_changed = false;
            for (let k = 0; k < n_splits; k++) {
                // Indices into the data array
                const segment1_start = k === 0 ? 0 : split_indices[k - 1];
                const split_index = split_indices[k];
                const segment2_end = k === n_splits - 1 ? sorted_data.length : split_indices[k + 1];

                // Compute entropy of 3 cases
                // For entropy of non-affected segments use precomputed values
                const stay_entropy = entropy_contributions.reduce(sum);
                const entropy_of_non_affected_segments = one_to_n(n_splits)
                    .filter((i) => ![split_index, split_index - 1].includes(i))
                    .map((i) => entropy_contributions[i])
                    .reduce(sum, []);

                // Moving split point left
                let move_left_entropy = 0;
                let move_left_segment1_entropy = 0;
                let move_left_segment2_entropy = 0;
                // If left segment has only one point we cannot move split point left
                if (split_index - segment1_start > 1) {
                    const segment1 = sorted_data.slice(segment1_start, split_index - 1);
                    move_left_segment1_entropy = this.segment_entropy_contribution(segment1, total_data_mass);
                    const segment2 = sorted_data.slice(split_index - 1, segment2_end);
                    move_left_segment2_entropy = this.segment_entropy_contribution(segment2, total_data_mass);
                    move_left_entropy = move_left_segment1_entropy + move_left_segment2_entropy + entropy_of_non_affected_segments;
                }

                // Moving split point right
                let move_right_entropy = 0;
                let move_right_segment1_entropy = 0;
                let move_right_segment2_entropy = 0;
                // If right segment has only one point we cannot move split point right
                if (segment2_end - split_index > 1) {
                    const segment1 = sorted_data.slice(segment1_start, split_index + 1);
                    move_right_segment1_entropy = this.segment_entropy_contribution(segment1, total_data_mass);
                    const segment2 = sorted_data.slice(split_index + 1, segment2_end);
                    move_right_segment2_entropy = this.segment_entropy_contribution(segment2, total_data_mass);
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
            }
        }
        return split_indices.map((i) => sorted_data[i]);
    }

    compute_segment_probabilities(sorted_data, split_indices, total_data_mass) {
        const q_k = [];
        let segment_start_index = 0;
        for (let k = 0; k < split_indices.length + 1; k++) {
            const segment_end_index = k === split_indices.length ? sorted_data.length : split_indices[k];
            const segment = sorted_data.slice(segment_start_index, segment_end_index);
            const segment_probability_mass = this.segment_probability_mass(segment, total_data_mass);
            q_k.push(segment_probability_mass);
            segment_start_index = segment_end_index;
        }
        return q_k;
    }

    segment_probability_mass(segment, total_data_mass) {
        const segment_mass = segment.reduce(sum);
        return segment_mass / (segment.length * total_data_mass);
    }

    segment_entropy_contribution(segment, total_data_mass) {
        const segment_size = segment.length;
        const segment_q = this.segment_probability_mass(segment, total_data_mass);
        return segment_size * -nlgn(segment_q);
    }
}
