import ticks from "ticks";
import LinearMapper from "./linear_mapping";
import {is_value_in_range, get_data_ranges} from "./util";

export default class MatchTicksMapper {

    tick_spacing = 0.05

    constructor(sorted_data, proportionate_split_mapper) {
        this.segment_input_ranges = proportionate_split_mapper.get_input_space_ranges()
        this.output_ranges = proportionate_split_mapper.get_output_space_ranges()
        this.data_ranges = get_data_ranges(sorted_data)
        this.input_ranges = this.choose_pretty_ranges()
        //Create proportional mapping from 0 to 1
        this.piecewise_linear_maps = []
        for (let i = 0; i < this.output_ranges.length; i++) {
            let linear_map = new LinearMapper([this.input_ranges[i]], this.output_ranges[i])
            this.piecewise_linear_maps.push(linear_map)
        }
    }

    choose_pretty_ranges() {
        let tick_ranges = []
        for (let i = 0; i < this.data_ranges.length; i++) {
            let screen_range = this.output_ranges[i]
            const tile_width = Math.abs(screen_range[0] - screen_range[1])
            const tick_no = Math.floor(tile_width / this.tick_spacing)
            let input_range = this.data_ranges[i]
            let pretty_ticks = ticks(input_range[0], input_range[1], tick_no)
            tick_ranges.push([pretty_ticks[0], pretty_ticks[pretty_ticks.length - 1]])
        }
        let pretty_ranges = []
        for (let i = 0; i < tick_ranges.length; i++) {
            let tick_range = tick_ranges[i]
            let pretty_range_start = tick_range[0]
            const range_overlaps_previous = i !== 0 && pretty_ranges[i - 1][1] > pretty_range_start
            const data_left_of_range = this.data_ranges[i][0] < pretty_range_start
            if (range_overlaps_previous || data_left_of_range || isNaN(pretty_range_start)) {
                pretty_range_start = this.data_ranges[i][0]
            }
            let pretty_range_end = tick_range[1]
            const range_overlaps_next = i !== tick_ranges.length - 1 && this.data_ranges[i + 1][0] < pretty_range_end
            const data_right_of_range = this.data_ranges[i][1] > pretty_range_end
            if (range_overlaps_next || data_right_of_range || isNaN(pretty_range_end)) {
                pretty_range_end = this.data_ranges[i][1]
            }
            pretty_ranges.push([pretty_range_start, pretty_range_end])
        }
        return pretty_ranges;
    }

    map(input) {
        for (let i = 0; i < this.input_ranges.length; i++) {
            let range = this.input_ranges[i]
            if (is_value_in_range(input, range, range[0], range[1])) {
                return this.piecewise_linear_maps[i].map(input)
            }
        }
    }

    map_inverse(output) {
        for (let i = 0; i < this.output_ranges.length; i++) {
            let range = this.output_ranges[i]
            if (is_value_in_range(output, range, range[0], range[1])) {
                let range_mapper = this.piecewise_linear_maps[i]
                return range_mapper.map_inverse(output)
            }
        }
    }


    get_input_space_ranges() {
        return this.input_ranges
    }

    get_output_space_ranges() {
        return this.output_ranges
    }
}