
export function simple_ranges(data, dimensions) {
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

export const hardcoded_numbeo_range = {
    'crime_index': [[0, 100]],
    'traffic_index': [[0, 320]],//unbounded max
    // 'rent_index': [[0, 101]],
    'rent_index': [[0, 20], [20, 101]],
    'groceries_index': [[0, 150]],//unbounded max, 100 is new york
    'restaurant_price_index': [[0, 170]],//unbounded max, 100 is new york
    'pollution_index': [[0, 100]],//actual values seem to be going to 113?
    'health_care_index': [[0, 100]],
    'quality_of_life_index': [[0, 200]],//unbounded
}