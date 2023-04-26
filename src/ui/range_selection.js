import * as d3 from "d3";
import MatchTicksMapper from "../mappings/match_ticks_mapping";

let range_selection_map = {
    mean: (sorted_data, split_mapper) => split_mapper,
    tight: (sorted_data, split_mapper) => split_mapper,
    nice: (sorted_data, split_mapper) => split_mapper,
    nice_swap: (sorted_data, split_mapper) => split_mapper,
    match_ticks: (sorted_data, split_mapper) => new MatchTicksMapper(sorted_data, split_mapper)
}

export function get_range_function() {
    return range_selection_map[d3.select("#range_argument select").property("value")]
}