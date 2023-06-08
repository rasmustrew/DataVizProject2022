import * as d3 from "d3";
import {is_value_in_range, splits_to_ranges} from "../mappings/util";

const read_tightness = () => parseInt(d3.select("#tightness input").property("value")) / 100

export const step3_selection_map = {
    unique: {
        algo: (sorted_data, splits) => unique_scaled(sorted_data, splits_to_ranges(sorted_data, splits)),
        arguments_id: [],
        read_args: () => {}
    },
    total: {
        algo: (sorted_data, splits) => total_scaled(sorted_data, splits_to_ranges(sorted_data, splits)),
        arguments_id: [],
        read_args: () => {}
    },
    equal: {
        algo: (sorted_data, splits) => equal_scaled(sorted_data, splits_to_ranges(sorted_data, splits)),
        arguments_id: ["#tightness"],
        read_args: () => read_tightness()
    },
    none: {
        algo: (sorted_data, splits) => none_scaled(sorted_data, splits_to_ranges(sorted_data, splits)),
        arguments_id: [],
        read_args: () => {}
    },
}

export function get_selected_step3_algorithm() {
    return step3_selection_map[d3.select("#step3_algorithm select").property("value")]
}

function none_scaled(sorted_data, input_ranges) {
    let range_total_size = input_ranges.reduce((acc, range) => {
        let range_size = range[1] - range[0]
        return acc + range_size
    }, 0)
    let range_proportions = input_ranges.map((range) => {
        let range_size = range[1] - range[0]
        return range_size / range_total_size
    })

    let current_proportion = 0
    let output_ranges = []
    for (let proportion of range_proportions) {
        let next_proportion = current_proportion + proportion
        output_ranges.push([current_proportion, next_proportion])
        current_proportion = next_proportion
    }

    return output_ranges
}

function total_scaled(sorted_data, input_ranges){
    let proportions = input_ranges.map((range) => {
        let points_in_range = sorted_data.filter((data_point) => {
            return is_value_in_range(data_point, range, sorted_data[0], sorted_data[sorted_data.length - 1])
        })
        let share_of_points = points_in_range.length / sorted_data.length
        return share_of_points
    })

    //Create proportional mapping from 0 to 1
    let output_ranges = []
    let proportions_processed = 0;
    for (let i = 0; i < proportions.length; i++) {
        let proportion = proportions[i]
        let output_range = [proportions_processed, proportions_processed + proportion]
        output_ranges.push(output_range)
        proportions_processed += proportion
    }

    return output_ranges
}

function unique_scaled(sorted_data, input_ranges) {
    let unique_sorted_data = sorted_data.filter((value, index, array) => array.indexOf(value) === index)
    return total_scaled(unique_sorted_data, input_ranges)
}

function equal_scaled(sorted_data, input_ranges) {
    let range_size = 1 / input_ranges.length
    let ranges = []
    for (let i = 0; i < input_ranges.length; i++) {
        ranges.push([i * range_size, (i+1) * range_size])
    }
    return ranges
}
