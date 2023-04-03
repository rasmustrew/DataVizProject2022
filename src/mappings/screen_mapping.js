import {is_value_in_range} from "./util";
import LinearMapper from "./linear_mapping";

export default class ScreenMapper {

    constructor(input_space_ranges, output_range, buffer_size) {
        let input_range_size = input_space_ranges.reduce((acc, range) => acc + (range[1] - range[0]), 0)
        this.input_start = input_space_ranges[0][0]
        this.input_end = input_space_ranges[input_space_ranges.length - 1][1]

        let num_gaps = input_space_ranges.length - 1;
        let output_start = output_range[0]
        let output_end = output_range[1]
        let output_size = Math.abs(output_end - output_start) - num_gaps * buffer_size;
        this.reverse = output_start > output_end
        this.output_start = output_start;
        this.output_end = output_end

        this.inner_mappers = []
        let current_output = output_start
        for (let range of input_space_ranges) {
            let range_size = Math.abs(range[1] - range[0]);
            let range_percent = range_size / input_range_size
            let new_output_range_size = output_size * range_percent
            let new_output_range_end;
            if (this.reverse) {
                new_output_range_end = current_output - new_output_range_size
            }
             else {
                 new_output_range_end = current_output + new_output_range_size
            }
            let mapper = new LinearMapper([range], [current_output, new_output_range_end])
            this.inner_mappers.push(mapper)
            current_output = new_output_range_end
            if (this.reverse) {
                current_output -= buffer_size
            } else {
                current_output += buffer_size
            }
        }
    }
    map(input) {
        let input_range_index = this.get_input_space_ranges().findIndex((range) =>
            is_value_in_range(input, range, this.input_start, this.input_end))
        // console.log(input_range_index)
        if (input_range_index === -1) return -1
        return this.inner_mappers[input_range_index].map(input)
    }

    map_inverse(output) {
        let output_range_index = this.get_output_space_ranges().findIndex((range) =>
            is_value_in_range(output, range, this.output_start, this.output_end))
        if (output_range_index === -1)
            return 0
        return this.inner_mappers[output_range_index].map_inverse(output)
    }

    get_input_space_ranges() {
        return this.inner_mappers.map((inner_mapper) => {
            return inner_mapper.get_input_space_ranges()[0]
        })
    }

    get_output_space_ranges() {
        return this.inner_mappers.map((inner_mapper) => {
            return inner_mapper.get_output_space_ranges()[0]
        })
    }


}