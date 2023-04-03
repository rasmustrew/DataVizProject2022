import LinearMapper from "./linear_mapping";
import {is_value_in_range} from "./util";

export default class ProportionateSplitMapper {

    constructor(sorted_data, split_points) {
        this.split_points = split_points
        this.min = sorted_data[0];
        this.max = sorted_data[sorted_data.length - 1]
        let points = [this.min, ...split_points, this.max]
        this.input_ranges = []
        for (let i = 0; i < points.length - 1; i++) {
            this.input_ranges.push([points[i], points[i+1]])
        }

        //Calculate how many percent of points is in each range
        let proportions = this.input_ranges.map((range) => {
            let points_in_range = sorted_data.filter((data_point) => {
                return is_value_in_range(data_point, range, this.min, this.max)
            })
            let share_of_points = points_in_range.length / sorted_data.length
            return share_of_points
        })

        //Create proportional mapping from 0 to 1
        this.output_ranges = []
        this.piecewise_linear_maps = []
        let proportions_processed = 0;
        for (let i = 0; i < proportions.length; i++) {
            let proportion = proportions[i]
            let input_range = this.input_ranges[i]
            let output_range = [proportions_processed, proportions_processed + proportion]
            let piecewise_linear_map = new LinearMapper([input_range], output_range)
            this.output_ranges.push(output_range)
            this.piecewise_linear_maps.push(piecewise_linear_map)
            proportions_processed += proportion
        }
    }

    map(input) {
        for (let i = 0; i < this.input_ranges.length; i++) {
            let range = this.input_ranges[i]
            if (is_value_in_range(input, range, this.min, this.max)) {
                let range_mapper = this.piecewise_linear_maps[i]
                let output = range_mapper.map(input)
                return output
            }
        }
    }

    map_inverse(output) {
        let output_min = this.map(this.min)
        let output_max = this.map(this.max)
        for (let i = 0; i < this.output_ranges.length; i++) {
            let range = this.output_ranges[i]
            if (is_value_in_range(output, range, output_min, output_max)) {
                let range_mapper = this.piecewise_linear_maps[i]
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
