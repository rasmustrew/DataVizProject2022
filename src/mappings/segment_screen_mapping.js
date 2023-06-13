import {is_value_in_range} from "./util";
import ScreenMapper from "./screen_mapping";

export default class SegmentScreenMapper {

    constructor(proportionate_range_mapper, screen_range, buffer_size) {
        this.p_range_mapper = proportionate_range_mapper
        this.screen_mapper = new ScreenMapper(this.p_range_mapper.get_output_space_ranges(), screen_range, buffer_size)
    }

    map(input) {
        let screen_mapper_input = this.p_range_mapper.map(input)
        // console.log(screen_mapper_input)
        let range_index = this.p_range_mapper.get_input_space_ranges().findIndex((range) =>
            is_value_in_range(input, range))
        if (range_index === -1) return -1
        return this.screen_mapper.inner_mappers[range_index].map(screen_mapper_input)
    }

    map_inverse(output) {
        let p_range_mapper_output = this.screen_mapper.map_inverse(output)
        let range_index = this.screen_mapper.get_output_space_ranges().findIndex((range) =>
            is_value_in_range(output, range))
        if (range_index === -1) return -1
        return this.p_range_mapper.inner_mappers[range_index].map_inverse(p_range_mapper_output)
    }

    get_input_space_ranges() {
        return this.p_range_mapper.get_input_space_ranges()
    }

    get_output_space_ranges() {
        return this.screen_mapper.get_output_space_ranges()
    }
}