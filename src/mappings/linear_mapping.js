export default class LinearMapper {

    //input_space_ranges is assumed to be continous- i.e. there are no gaps in the input space ranges
    //output_range is a single range array with the smaller value first, and larger value second
    constructor(input_space_ranges, output_range) {
        this.input_ranges = input_space_ranges;
        this.input_start = input_space_ranges[0][0];
        this.input_end = input_space_ranges[input_space_ranges.length - 1][1];
        this.input_size = this.input_end - this.input_start;
        this.output_size = output_range[1] - output_range[0];
        this.output_start = output_range[0]
        this.output_end = output_range[1]
    }
    map(input) {
        let input_percentage = (input - this.input_start) / this.input_size
        let output = input_percentage * this.output_size + this.output_start
        return output
    }

    get_input_space_ranges() {
        return this.input_ranges
    }

    get_output_space_ranges() {
        return [[this.output_start, this.output_end]]
    }
}