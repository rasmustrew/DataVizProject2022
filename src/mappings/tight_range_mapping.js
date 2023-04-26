

class TightRangeMapper {

    constructor(sorted_data, proportionate_split_mapper) {
        this.segment_input_ranges = proportionate_split_mapper.get_input_space_ranges()
        this.output_ranges = proportionate_split_mapper.get_output_space_ranges()
    }



}