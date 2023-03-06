import * as d3 from "d3";
export default class BoxCoxMapper {

    //input_space_ranges is assumed to be continous- i.e. there are no gaps in the input space ranges
    //output_range is a single range array with the smaller value first, and larger value second
    constructor(input_space_ranges, lambda) {
        this.input_ranges = input_space_ranges;
        this.input_start = input_space_ranges[0][0];
        this.input_end = input_space_ranges[input_space_ranges.length - 1][1];
        this.lambda = lambda
        let epsilon = 0.0000001

        this.lambda_2 = 0
        if (this.input_start < 0) {
            this.lambda_2 = (-this.input_start) + epsilon
        }
    }
    map(input) {
        if (this.lambda === 0) {
            return Math.log(input + this.lambda_2)
        }
        return (Math.pow(input + this.lambda_2, this.lambda) - 1)/this.lambda
    }

    map_inverse(output) {
        if (this.lambda === 0) {
            return Math.exp(output) - this.lambda_2
        }
        return Math.pow((output * this.lambda) + 1, 1/this.lambda) - this.lambda_2
    }

    get_input_space_ranges() {
        return this.input_ranges
    }

    get_output_space_ranges() {
        return this.get_input_space_ranges().map((range) => {
            return [this.map(range[0]), this.map(range[1])]
        })
    }
}