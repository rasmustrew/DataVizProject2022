import * as d3 from "d3";
import {read_tick_density} from "./step5";
import {ExtendedWilkinson} from "../algorithms/extended_wilkinsons";

const read_tightness = () => parseInt(d3.select("#tightness input").property("value")) / 100

export const step4_selection_map = {
    mean: {
        algo: mean_ranges,
        arguments_id: [],
        read_args: () => {}
    },
    tight: {
        algo: tight_ranges,
        arguments_id: [],
        read_args: () => {}
    },
    nice: {
        algo: nice_number_ranges,
        arguments_id: ["#tightness"],
        read_args: () => read_tightness()
    },
    match_ticks: {
        algo: (sorted_data, splits, output_ranges, args) => match_tick_fractions_ranges(sorted_data, splits, output_ranges,args, [1]),
        arguments_id: ["#tightness", "#tick_density"],
        read_args: () => {
            return {
                tightness_weight: read_tightness(),
                tick_spacing: read_tick_density()
            }
        }
    },
    match_tick_fractions: {
        algo: match_tick_fractions_ranges,
        arguments_id: ["#tightness", "#tick_density"],
        read_args: () => {
            return {
                tightness_weight: read_tightness(),
                tick_spacing: read_tick_density()
            }
        }
    }
}

export function get_selected_step4_algorithm() {
    return step4_selection_map[d3.select("#step4_algorithm select").property("value")]
}

export function tight_ranges(sorted_data, split_points, output_ranges) {
    let data_ranges = []
    let segment_begin = sorted_data[0]
    let split_index = 0
    for (let i = 0; i < sorted_data.length; i++) {
        if (sorted_data[i] > split_points[split_index]) {
            data_ranges.push([segment_begin, sorted_data[i - 1]])
            segment_begin = sorted_data[i]
            split_index++
        }
    }
    data_ranges.push([segment_begin, sorted_data[sorted_data.length - 1]])
    return data_ranges
}

export function mean_ranges(sorted_data, split_points, output_ranges) {
    let min_val = sorted_data[0];
    let max_val = sorted_data[sorted_data.length - 1]
    let points = [min_val, ...split_points, max_val]
    let ranges = []
    for (let i = 0; i < points.length - 1; i++) {
        ranges.push([points[i], points[i + 1]])
    }
    return ranges
}

export function match_tick_fractions_ranges(sorted_data, splits, output_ranges, args, divisors = [1, 2, 5, 4]) {
    let data_ranges = tight_ranges(sorted_data, splits)
    let tick_candidates = tick_fraction_candidates(data_ranges, output_ranges, args.tick_spacing, divisors)
    let pretty_ranges = nice_and_tight_ranges(data_ranges, output_ranges, tick_candidates, args.tightness_weight)
    return pretty_ranges
}

export function nice_number_ranges(sorted_data, splits, output_ranges, tightness_weight) {
    let divisors = [1, 2, 5]
    let data_ranges = tight_ranges(sorted_data, splits)
    let nice_candidates = nice_range_candidates(data_ranges, divisors);
    let pretty_ranges = nice_and_tight_ranges(data_ranges, output_ranges, nice_candidates, tightness_weight)
    return pretty_ranges
}

function tick_fraction_candidates(data_ranges, output_ranges, tick_spacing_target, divisors) {
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
            max_candidates.push(j)
        }
        tick_ranges.push([min_candidates, max_candidates])
    }
    return tick_ranges
}

function get_ticks(data_range, screen_range, tick_spacing) {
    const tile_width = Math.abs(screen_range[0] - screen_range[1])
    const tick_no = Math.floor(tile_width / tick_spacing)
    return ExtendedWilkinson(data_range, tick_no)
}

function nice_range_candidates(data_ranges, divisors) {
    let nice_range_candidates = []
    for (const range of data_ranges) {
        let range_start = range[0]
        let range_end = range[1]
        let range_length = range_end - range_start
        let range_magnitude = Math.floor(Math.log10(range_length))
        let nice_start_candidates = []
        let nice_end_candidates = []
        for (let i = 0; i < 3; i++) {
            let base = Math.pow(10, range_magnitude - i)
            for (const divisor of divisors) {
                let granularity = base / divisor
                let snapped_start = Math.floor(range_start / granularity) * granularity
                nice_start_candidates.push(snapped_start)
                let snapped_end = Math.ceil(range_end / granularity) * granularity
                nice_end_candidates.push(snapped_end)
            }
        }
        nice_range_candidates.push([nice_start_candidates, nice_end_candidates])
    }
    return nice_range_candidates;
}

function nice_and_tight_ranges(data_ranges, output_ranges, nice_range_candidates, tightness_weight) {
    let pretty_ranges = []
    let full_data_length = data_ranges[data_ranges.length - 1][1] - data_ranges[0][0]
    let full_screen_space_length = output_ranges[output_ranges.length - 1][1] - output_ranges[0][0]
    for (let i = 0; i < nice_range_candidates.length; i++) {
        let data_range_start = data_ranges[i][0]
        let data_range_end = data_ranges[i][1]
        let data_range_length = data_range_end - data_range_start
        let output_range_length = output_ranges[i][1] - output_ranges[i][0]
        let section_size = output_range_length / full_screen_space_length
        // Right range bound
        let nice_range_starts = nice_range_candidates[i][0]
        let nicest_range_start = data_range_start
        let nicest_range_start_score = 0
        let n_candidates = nice_range_starts.length
        for (let j = 0; j < nice_range_starts.length; j++) {
            let nice_start = nice_range_starts[j]
            let range_overlaps_previous = i !== 0 && pretty_ranges[i - 1][1] > nice_start
            let data_left_of_range = data_range_start < nice_start
            let is_valid_start = !range_overlaps_previous && !data_left_of_range && !isNaN(nice_start)
            if (is_valid_start) {
                let range_start_score = range_bound_cost(
                    section_size, data_range_length, n_candidates,
                    nice_start, data_range_start, j, tightness_weight
                )
                if (range_start_score > nicest_range_start_score) {
                    nicest_range_start_score = range_start_score
                    nicest_range_start = nice_start
                }
            }
        }
        // Left range bound
        let nice_range_ends = nice_range_candidates[i][1]
        let nicest_range_end = data_ranges[i][1]
        let nicest_range_end_score = 0
        n_candidates = nice_range_ends.length
        for (let j = 0; j < nice_range_ends.length; j++) {
            let nice_end = nice_range_ends[j]
            let range_overlaps_next = i !== nice_range_candidates.length - 1 && data_ranges[i + 1][0] < nice_end
            let data_right_of_range = data_ranges[i][1] > nice_end
            let is_valid_end = !range_overlaps_next && !data_right_of_range && !isNaN(nice_end)
            if (is_valid_end) {
                let range_end_score = range_bound_cost(
                    section_size, data_range_length, n_candidates,
                    nice_end, data_range_end, j, tightness_weight
                )
                if (range_end_score > nicest_range_end_score) {
                    nicest_range_end_score = range_end_score
                    nicest_range_end = nice_end
                }
            }
        }
        pretty_ranges.push([nicest_range_start, nicest_range_end])
    }

    return pretty_ranges;
}

function range_bound_cost(section_size, range_length, no_of_ranges, nice_bound, range_bound, j, tightness_weight) {
    let simplicity = 1 - j / no_of_ranges
    let tightness = (1 - Math.abs(range_bound - nice_bound) / range_length) * section_size
    return tightness * tightness_weight + simplicity * (1 - tightness_weight)
}
