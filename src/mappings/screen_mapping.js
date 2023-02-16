import {is_value_in_range} from "./util";

export default class ScreenMapper {

    //input_space_ranges is assumed to be continuous- i.e. there are no gaps in the input space ranges
    //output_range is a single range array with the smaller value first, and larger value second
    constructor(input_space_ranges, output_range, buffer_size) {
        this.input_ranges = input_space_ranges;
        this.input_start = input_space_ranges[0][0];
        this.input_end = input_space_ranges[input_space_ranges.length - 1][1];
        this.input_size = this.input_end - this.input_start;

        this.buffer_size = buffer_size;
        let num_gaps = input_space_ranges.length - 1;
        this.output_size = (output_range[1] - output_range[0]) - num_gaps * buffer_size;
        this.output_start = output_range[0]
    }
    map(input) {
        let input_range_index = this.input_ranges.findIndex((range) =>
            is_value_in_range(input, range, this.input_start, this.input_end))
        let input_percentage = (input - this.input_start) / this.input_size

        let output = input_percentage * this.output_size + this.output_start + this.buffer_size * input_range_index
        return output
    }

    get_input_space_ranges() {
        return this.input_ranges
    }

    get_output_space_ranges() {
        let ranges = [[this.map(this.input_ranges[0][0]), this.map(this.input_ranges[0][1])]]
        for (let i = 1; i < this.input_ranges.length; i++) {
            let input_range = this.input_ranges[i];
            let start = this.map(input_range[0]) + this.buffer_size
            let end = this.map(input_range[1])
            ranges.push([start, end])
        }
        return ranges
    }


}