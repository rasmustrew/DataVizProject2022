import * as d3 from "d3";
import {match_tick_fractions_mapper, nice_number_mapper} from "../mappings/pretty_mapping.js";
import {proportionate_split_mapper} from "../mappings/proportionate_split_mapping";
import {tight_range_mapper} from "../mappings/tight_range_mapping";
import {read_tick_density} from "./step4";

const read_tightness = () => parseInt(d3.select("#tightness input").property("value")) / 100

export const step3_selection_map = {
    mean: {
        algo: proportionate_split_mapper,
        arguments_id: [],
        read_args: () => {}
    },
    tight: {
        algo: tight_range_mapper,
        arguments_id: [],
        read_args: () => {}
    },
    nice: {
        algo: nice_number_mapper,
        arguments_id: ["#tightness"],
        read_args: () => read_tightness()
    },
    match_ticks: {
        algo: (sorted_data, splits, args) => match_tick_fractions_mapper(sorted_data, splits, [1], args),
        arguments_id: ["#tightness", "#tick_density"],
        read_args: () => {
            return {
                tightness_weight: read_tightness(),
                tick_spacing: read_tick_density()
            }
        }
    },
    match_tick_fractions: {
        algo: match_tick_fractions_mapper,
        arguments_id: [],
        read_args: () => {}
    }
}

export function get_selected_step3_algorithm() {
    return step3_selection_map[d3.select("#step3_algorithm select").property("value")]
}
