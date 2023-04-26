import ticks from "ticks";
import {get_data_ranges} from "./util";
import ProportionateRangeMapper from "./proportionate_split_mapping";

export function match_ticks_mapper(sorted_data, splits) {
    let data_ranges = get_data_ranges(sorted_data, splits)
    let proportional_range_mapper = new ProportionateRangeMapper(sorted_data, data_ranges)
    let output_ranges = proportional_range_mapper.get_output_space_ranges()
    let pretty_ranges = choose_pretty_ranges(data_ranges, output_ranges)
    return new ProportionateRangeMapper(sorted_data, pretty_ranges)
}

function choose_pretty_ranges(data_ranges, output_ranges, tick_spacing = 0.05) {
    let tick_ranges = []
    for (let i = 0; i < data_ranges.length; i++) {
        let screen_range = output_ranges[i]
        const tile_width = Math.abs(screen_range[0] - screen_range[1])
        const tick_no = Math.floor(tile_width / tick_spacing)
        let input_range = data_ranges[i]
        let pretty_ticks = ticks(input_range[0], input_range[1], tick_no)
        tick_ranges.push([pretty_ticks[0], pretty_ticks[pretty_ticks.length - 1]])
    }
    let pretty_ranges = []
    for (let i = 0; i < tick_ranges.length; i++) {
        let tick_range = tick_ranges[i]
        let pretty_range_start = tick_range[0]
        const range_overlaps_previous = i !== 0 && pretty_ranges[i - 1][1] > pretty_range_start
        const data_left_of_range = data_ranges[i][0] < pretty_range_start
        if (range_overlaps_previous || data_left_of_range || isNaN(pretty_range_start)) {
            pretty_range_start = data_ranges[i][0]
        }
        let pretty_range_end = tick_range[1]
        const range_overlaps_next = i !== tick_ranges.length - 1 && data_ranges[i + 1][0] < pretty_range_end
        const data_right_of_range = data_ranges[i][1] > pretty_range_end
        if (range_overlaps_next || data_right_of_range || isNaN(pretty_range_end)) {
            pretty_range_end = data_ranges[i][1]
        }
        pretty_ranges.push([pretty_range_start, pretty_range_end])
    }
    return pretty_ranges;
}
