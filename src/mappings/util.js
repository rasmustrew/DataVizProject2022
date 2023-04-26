
export function get_data_ranges(sorted_data, split_points) {
    let data_ranges = []
    let segment_begin = sorted_data[0]
    let split_index = 0
    for (let i = 0; i < sorted_data.length; i++) {
        if (sorted_data[i] > split_points[split_index]) {
            data_ranges.push([segment_begin, sorted_data[i - 1]])
            segment_begin = sorted_data[i]
            split_index++
        }
    }
    data_ranges.push([segment_begin, sorted_data[sorted_data.length - 1]])
    return data_ranges
}

export function is_unique(value, index, self) {
    return self.indexOf(value) === index;
    // return true
}

export function is_value_in_range(value, range, min_value, max_value) {
    let min_range = Math.min(range[0], range[1])
    let max_range = Math.max(range[0], range[1])
    if (value === min_value) {
        return ((value >= min_range) && (value <= max_range))
    } else if (value === max_value) {
        return ((value >= min_range) && (value <= max_range))
    }
    return ((value >= min_range) && (value < max_range))
}
