import {get_data_ranges} from "./util";
import ProportionateRangeMapper from "./proportionate_split_mapping";
import {ExtendedWilkinson} from "../algorithms/extended_wilkinsons";
import * as d3 from "d3";

export function match_tick_fractions_mapper(sorted_data, splits, divisors = [1, 2, 5, 4], tick_spacing = 0.05) {
    tick_spacing = (1 - parseInt(d3.select("#tick_density_argument input").property("value")) / 100) ** 2 / 2
    let data_ranges = get_data_ranges(sorted_data, splits)
    let proportional_range_mapper = new ProportionateRangeMapper(sorted_data, data_ranges)
    let output_ranges = proportional_range_mapper.get_output_space_ranges()
    let pretty_ranges = choose_tick_ranges(data_ranges, output_ranges, tick_spacing, divisors)
    return new ProportionateRangeMapper(sorted_data, pretty_ranges)
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
    let valid_candidates = filter_valid_range_candidates(data_ranges, tick_ranges)
    return nicest_bounds(valid_candidates)
}

function get_ticks(data_range, screen_range, tick_spacing) {
    const tile_width = Math.abs(screen_range[0] - screen_range[1])
    const tick_no = Math.floor(tile_width / tick_spacing)
    return ExtendedWilkinson(data_range, tick_no)
}

export function nice_number_mapper(sorted_data, splits, divisors = [1, 2, 5]) {
    let data_ranges = get_data_ranges(sorted_data, splits)
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
    let valid_ranges = filter_valid_range_candidates(data_ranges, nice_range_candidates)
    let pretty_ranges = nice_and_tight_bounds(data_ranges, valid_ranges)
    return new ProportionateRangeMapper(sorted_data, pretty_ranges)
}

function filter_valid_range_candidates(data_ranges, nice_range_candidates) {
    let valid_candidates = []
    for (let i = 0; i < nice_range_candidates.length; i++) {
        let nice_range_bounds = nice_range_candidates[i]
        let nice_range_starts = nice_range_bounds[0]
        let valid_range_starts = []
        for (const nice_start of nice_range_starts) {
            const range_overlaps_previous = i !== 0 && valid_candidates[i - 1][1][0] > nice_start
            const data_left_of_range = data_ranges[i][0] < nice_start
            if (!range_overlaps_previous && !data_left_of_range && !isNaN(nice_start)) {
                valid_range_starts.push(nice_start)
            }
        }
        let nice_range_ends = nice_range_bounds[1]
        let valid_range_ends = []
        for (const nice_end of nice_range_ends) {
            const range_overlaps_next = i !== nice_range_candidates.length - 1 && data_ranges[i + 1][0] < nice_end
            const data_right_of_range = data_ranges[i][1] > nice_end
            if (!range_overlaps_next && !data_right_of_range && !isNaN(nice_end)) {
                valid_range_ends.push(nice_end)
            }
        }
        if (valid_range_starts.length === 0) valid_range_starts.push(data_ranges[i][0])
        if (valid_range_ends.length === 0) valid_range_ends.push(data_ranges[i][1])
        valid_candidates.push([valid_range_starts, valid_range_ends])
    }

    return valid_candidates;
}

function nicest_bounds(valid_candidates) {
    let pretty_ranges = []
    for (let i = 0; i < valid_candidates.length; i++) {
        pretty_ranges.push([valid_candidates[i][0][0], valid_candidates[i][1][0]])
    }
    return pretty_ranges
}

function range_bound_cost(range_length, no_of_ranges, nice_bound, range_bound, j) {
    let simplicity = 1 - j / no_of_ranges
    let tightness = 1 - Math.abs(range_bound - nice_bound) / range_length
    return tightness * 0.4 + simplicity * 0.6
}

function nice_and_tight_bounds(data_ranges, valid_candidates) {
    let pretty_ranges = []
    for (let i = 0; i < valid_candidates.length; i++) {
        let range_length = data_ranges[i][1] - data_ranges[i][0]

        let valid_range_starts = valid_candidates[i][0]
        let best_range_start = data_ranges[i][0]
        let best_range_start_score = 0
        let n_candidates = valid_range_starts.length
        for (let j = 0; j < n_candidates; j++) {
            let range_start_score = range_bound_cost(range_length, n_candidates, valid_range_starts[j], data_ranges[i][0], j)
            if (range_start_score > best_range_start_score) {
                best_range_start_score = range_start_score
                best_range_start = valid_range_starts[j]
            }
        }

        let valid_range_ends = valid_candidates[i][1]
        let best_range_end = data_ranges[i][1]
        let best_range_end_score = 0
        n_candidates = valid_range_ends.length
        for (let j = 0; j < n_candidates; j++) {
            let range_end_score = range_bound_cost(range_length, n_candidates, valid_range_ends[j], data_ranges[i][1], j)
            if (range_end_score > best_range_end_score) {
                best_range_end_score = range_end_score
                best_range_end = valid_range_ends[j]
            }
        }
        pretty_ranges.push([best_range_start, best_range_end])
    }
    return pretty_ranges
}
