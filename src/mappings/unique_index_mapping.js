import {is_unique} from "./util";
export default class UniqueIndexMapper {
    constructor(sorted_data) {
        this.unique_data_values = sorted_data.filter(is_unique)
    }
    map(input) {
        let index = this.unique_data_values.findIndex((value) => {
            return input === value
        })

        return index
    }

    get_input_space_ranges() {
        let ranges = []
        let last_split = this.unique_data_values[0]
        for (let i = 0; i < this.unique_data_values.length - 1; i++) {
            let mean = (this.unique_data_values[i] + this.unique_data_values[i+1])/2
            ranges.push([last_split, mean])
            last_split = mean
        }
        ranges.push([last_split, this.unique_data_values[this.unique_data_values.length-1]])
        return ranges
    }

    get_output_space_ranges() {
        let ranges = []
        ranges.push([0, 0.5])
        for (let i = 0; i < this.unique_data_values.length - 1; i++) {
            ranges.push([i + 0.5, i + 1.5])
        }

        ranges.push([this.unique_data_values.length - 1.5, this.unique_data_values.length - 1])
        return ranges
    }
}