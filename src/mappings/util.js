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