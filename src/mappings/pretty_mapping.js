import {get_data_ranges} from "./util";
import ProportionateRangeMapper from "./proportionate_split_mapping";
import {ExtendedWilkinson} from "../algorithms/extended_wilkinsons";
import * as d3 from "d3";

export function match_tick_fractions_mapper(sorted_data, splits, divisors = [1, 2, 4, 8], tick_spacing = 0.05) {
    tick_spacing = (1 - parseInt(d3.select("#tick_density_argument input").property("value")) / 100) ** 2 / 2
    let data_ranges = get_data_ranges(sorted_data, splits)
    let proportional_range_mapper = new ProportionateRangeMapper(sorted_data, data_ranges)
    let output_ranges = proportional_range_mapper.get_output_space_ranges()
    let pretty_ranges = choose_tick_ranges(data_ranges, output_ranges, tick_spacing, divisors)
    return new ProportionateRangeMapper(sorted_data, pretty_ranges)
}

function get_ticks(data_range, screen_range, tick_spacing) {
    const tile_width = Math.abs(screen_range[0] - screen_range[1])
    const tick_no = Math.floor(tile_width / tick_spacing)
    return ExtendedWilkinson(data_range, tick_no)
}

function choose_tick_ranges(data_ranges, output_ranges, tick_spacing_target, divisors) {
    let tick_ranges = []
    for (let i = 0; i < data_ranges.length; i++) {
        let data_range = data_ranges[i]
        let tick_result = get_ticks(data_range, output_ranges[i], tick_spacing_target)
        let tick_spacing = tick_result.lstep
        let min_candidates = []
        let first_internal_tick = tick_result.lmin < data_range[0] ? tick_result.lmin + tick_spacing : tick_result.lmin
        for (const divisor of divisors) {
            let frac_step_size = tick_spacing / divisor
            let j = first_internal_tick
            while (data_range[0] < j) {
                j -= frac_step_size
            }
            min_candidates.push(j)
        }
        let max_candidates = []
        let last_internal_tick = tick_result.lmax > data_ranges[i][1] ? tick_result.lmax - tick_spacing : tick_result.lmax
        for (const divisor of divisors) {
            let frac_step_size = tick_spacing / divisor
            let j = last_internal_tick
            while (j < data_range[1]) {
                j += frac_step_size
            }
            min_candidates.push(j)
        }
        tick_ranges.push([min_candidates, max_candidates])
    }
    return choose_nice_ranges(data_ranges, tick_ranges)
}

function choose_nice_ranges(data_ranges, nice_range_numbers) {
    let pretty_ranges = []
    for (let i = 0; i < nice_range_numbers.length; i++) {
        let nice_range_bounds = nice_range_numbers[i]
        let nice_range_starts = nice_range_bounds[0]
        let range_start = data_ranges[i][0]
        for (const nice_start of nice_range_starts) {
            const range_overlaps_previous = i !== 0 && pretty_ranges[i - 1][1] > nice_start
            const data_left_of_range = data_ranges[i][0] < nice_start
            if (!range_overlaps_previous && !data_left_of_range && !isNaN(nice_start)) {
                range_start = nice_start
                break;
            }
        }
        let nice_range_ends = nice_range_bounds[1]
        let range_end = data_ranges[i][1]
        for (const nice_end of nice_range_ends) {
            const range_overlaps_next = i !== nice_range_numbers.length - 1 && data_ranges[i + 1][0] < nice_end
            const data_right_of_range = data_ranges[i][1] > nice_end
            if (range_overlaps_next || data_right_of_range || isNaN(nice_end)) {
                range_end = nice_end
                break;
            }
        }
        pretty_ranges.push([range_start, range_end])
    }
    return pretty_ranges;
}

