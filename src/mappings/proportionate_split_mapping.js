import LinearMapper from "./linear_mapping";
import {is_value_in_range} from "./util";


export default class PiecewiseLinearMapper {

    constructor(input_ranges, output_ranges) {
        this.input_ranges = input_ranges
        this.output_ranges = output_ranges
        this.inner_mappers = []
        for (let i = 0; i < input_ranges.length; i++) {
            let input_range = this.input_ranges[i]
            let output_range = this.output_ranges[i]
            let piecewise_linear_map = new LinearMapper([input_range], output_range)
            this.inner_mappers.push(piecewise_linear_map)
        }
    }

    map(input) {
        for (let i = 0; i < this.input_ranges.length; i++) {
            let range = this.input_ranges[i]
            if (is_value_in_range(input, range)) {
                let range_mapper = this.inner_mappers[i]
                let output = range_mapper.map(input)
                return output
            }
        }
    }

    map_inverse(output) {
        for (let i = 0; i < this.output_ranges.length; i++) {
            let range = this.output_ranges[i]
            if (is_value_in_range(output, range)) {
                let range_mapper = this.inner_mappers[i]
                let input = range_mapper.map_inverse(output)
                return input
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
