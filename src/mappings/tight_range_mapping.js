import {get_data_ranges} from "./util";
import ProportionateRangeMapper from "./proportionate_split_mapping";


export function tight_range_mapper(sorted_data, splits) {
    let ranges = get_data_ranges(sorted_data, splits)
    return new ProportionateRangeMapper(sorted_data, ranges)
}