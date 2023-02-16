export function is_unique(value, index, self) {
    return self.indexOf(value) === index;
    // return true
}

export function is_value_in_range(value, range, min_value, max_value) {
    if (value === min_value) {
        return ((value >= range[0]) && (value <= range[1]))
    } else if (value === max_value) {
        return ((value >= range[0]) && (value <= range[1]))
    }
    return ((value >= range[0]) && (value < range[1]))
}