export default class UniformMapper {
    constructor(sorted_data) {
        this.sorted_data = sorted_data;
        this.sorted_data_u = Array.from(new Set(sorted_data));
    }

    map(input) {
        const index = this.sorted_data_u.indexOf(input);
        return index / this.sorted_data_u.length;
    }

    map_inverse(output) {
        let index = output * this.sorted_data_u.length
        index = Math.round(index);
        return this.sorted_data_u[index];
    }

    get_input_space_ranges() {
        const min_value = Math.min(... this.sorted_data_u);
        const max_value = Math.max(... this.sorted_data_u);
        return [[min_value, max_value]];
    }

    get_output_space_ranges() {
        return [[0, 1]]
    }
}