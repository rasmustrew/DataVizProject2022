

//Creates an identity mapper for a single dimension
export default class IdentityMapper {


    constructor(sorted_data) {
        this.ranges = {};
        let min_value = sorted_data[0]
        let max_value = sorted_data[sorted_data.length - 1]
        this.ranges = [[min_value, max_value]]

    }
    map(input) {
        return input
    }

    map_inverse(output) {
        return output
    }

    get_input_space_ranges() {
        return this.ranges
    }

    get_output_space_ranges() {
        return this.ranges
    }
}