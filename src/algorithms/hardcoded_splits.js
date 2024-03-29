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

export const hardcoded_animals_range = {
    'Overall Sample Size ': [[0, 850], [850, 1650], [1650, 3406]],
    'Overall MLE': [[2, 22], [22, 47]],
    'Overall CI - lower': [[2, 18], [18, 38]],
    'Overall CI - upper': [[2.5, 20], [20, 53]],
    'Male Sample Size': [[26, 50], [50, 360], [360, 1425]],
    'Male MLE': [[2.5, 19], [19, 51.5]],
    'Male CI - lower': [[2, 18], [18, 41.5]],
    'Male CI - upper': [[2.5, 25], [25, 55]]
}

const hardcoded_periodic_table_splits = {
    'boiling_point': [400],
    // 'abundance/universe': [ 8e-7,  8e-5, 8e-3, 8e-1, ],
    // 'abundance/universe': [1.48872008e-02,  8.66795019e-01,  1.14295692e+01],
    'abundance/universe': [0.0009273414413707938, 0.13437282585692462, 1.2912620979636045],
    'conductivity/thermal': [1, 250],
    'density/stp': [2.25],
    'ionization_energies/0': [],
    'melting_point': [100],
    'electron_affinity': [],
    'discovered/year': [1650]
}
//[-7.06262354e-03  1.48872008e-02  8.66795019e-01  1.14295692e+01
//   7.50000000e+01]
