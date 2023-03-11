export default class InterpolationMapper {

    //Takes a list of mappers, and applies them one after the other
    constructor(mapper1, mapper2, interpolation=0.5) {
        this.mapper1 = mapper1
        this.mapper2 = mapper2
        this.interpolation = interpolation
    }

    map(input) {
        const output1 = this.mapper1.map(input)
        const output2 = this.mapper2.map(input)
        const output = output1 * (1 - this.interpolation) + output2 * this.interpolation
        return output
    }

    // Interpolation is not invertible
    map_inverse(output) {
        return this.mapper1.map_inverse(output)
    }

    get_input_space_ranges() {
        return this.mapper1.get_input_space_ranges();
    }

    get_output_space_ranges() {
        return this.mapper1.get_output_space_ranges();
    }
}