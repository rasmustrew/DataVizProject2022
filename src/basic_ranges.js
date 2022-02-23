
export function basic_ranges(data, dimensions) {
    let range_map = {};
    dimensions.forEach((dimension) => {
        let running_min = parseFloat(data[0][dimension])
        let running_max = parseFloat(data[0][dimension])
        for (let index in data) {
            let data_point = data[index]
            data_point = parseFloat(data_point[dimension])
            running_min = Math.min(data_point, running_min)
            running_max = Math.max(data_point, running_max)
        }
        range_map[dimension] = [[running_min, running_max]]
    });

    return range_map;
}