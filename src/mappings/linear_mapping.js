import * as d3 from "d3";
export default class LinearMapper {

    //input_space_ranges is assumed to be continous- i.e. there are no gaps in the input space ranges
    //output_range is a single range array with the smaller value first, and larger value second
    constructor(input_space_ranges, output_range) {
        this.input_ranges = input_space_ranges;
        this.input_start = input_space_ranges[0][0];
        this.input_end = input_space_ranges[input_space_ranges.length - 1][1];
        this.output_range = output_range
        this.d3_scale = d3.scaleLinear().domain([this.input_start, this.input_end]).range(output_range)
    }
    map(input) {
        // let input_percentage = (input - this.input_start) / this.input_size
        // let output = input_percentage * this.output_size + this.output_start
        // return output
        return this.d3_scale(input)
    }

    map_inverse(output) {
        this.d3_scale.invert(output)
    }

    get_input_space_ranges() {
        return this.input_ranges
    }

    get_output_space_ranges() {
        return [this.output_range]
    }
}