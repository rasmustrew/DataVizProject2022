
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

export const hardcoded_un_range = {
    'Surface area (km2)': [[26, 10000], [10000, 17098246]],
    'Population in thousands (2017)': [[5, 50000], [50000, 1409517]],
    'Population density (per km2, 2017)': [[0.1, 500], [500, 20821.6]],
    'GDP: Gross domestic product (million current US$)': [[33, 1000000], [100000, 18036648]],
    'International trade: Balance (million US$)': [[-796494, -100000], [-100000, 40000], [40000, 530285]],
    'International trade: Exports (million US$)': [[0, 60000], [60000, 2118981]],
    'International trade: Imports (million US$)': [[12, 60000], [60000, 2249661]],
    'GDP growth rate (annual %, const. 2005 prices)': [[-28.1, 0], [0, 10], [10, 26.3]],
    'GDP per capita (current US$)': [[144.5, 10000], [10000, 45000], [45000, 100160.8]]
}