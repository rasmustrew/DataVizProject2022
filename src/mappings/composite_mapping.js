export default class CompositeMapper {

    //Takes a list of mappers, and applies them one after the other
    constructor(list_of_mappers) {
        this.mappers = list_of_mappers

    }
    map(input) {
        let output = input;
        // console.log(input)
        for (let mapper of this.mappers) {

            output = mapper.map(output)
            // console.log(mapper)
            // console.log(output)
        }
        return output
    }

    map_inverse(output) {
        let input = output;
        for (let mapper of [...this.mappers].reverse()) {
            input = mapper.map_inverse(input)
        }
        return input
    }

    get_input_space_ranges() {
        return this.mappers[0].get_input_space_ranges();
    }

    get_output_space_ranges() {
        return this.mappers[this.mappers.length - 1].get_output_space_ranges();
    }
}