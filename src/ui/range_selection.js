import * as d3 from "d3";
import {match_ticks_mapper} from "../mappings/pretty_mapping.js";
import {proportionate_split_mapper} from "../mappings/proportionate_split_mapping";
import {tight_range_mapper} from "../mappings/tight_range_mapping";

let range_selection_map = {
    mean: proportionate_split_mapper,
    tight: tight_range_mapper,
    nice: proportionate_split_mapper,
    match_ticks: match_ticks_mapper
}

export function get_range_function() {
    return range_selection_map[d3.select("#range_argument select").property("value")]
}