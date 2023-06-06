import {proportionate_split_mapper} from "../mappings/proportionate_split_mapping";

export function quantile_splits(sorted_data, args) {
    let unique_data = [...new Set(sorted_data)]
    let number_of_splits = args["clusters"]
    let n_elements = Math.floor(unique_data.length / number_of_splits)
    let split_points = []
    for (let i = 1; i < number_of_splits; i++) {
        let left_border_value = unique_data[i * n_elements - 1]
        let right_border_value = unique_data[i * n_elements ]
        let split_point = left_border_value + ((right_border_value - left_border_value) / 2)
        // split_points.push(split_point)
        split_points.push(left_border_value)
    }

    return split_points
}
