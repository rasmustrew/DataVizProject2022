
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

export const hardcoded_periodic_table_range = {
    'boiling_point': [[4.222, 400], [400, 6203]],
    'abundance/universe': [[8e-9, 8e-7], [8e-7, 8e-5], [8e-5, 8e-3], [8e-3, 8e-1], [8e-1, 75]],
    // 'abundance/universe': [[8e-9, 0.1], [0.1, 75]],
    'conductivity/thermal': [[0.00565, 1], [1, 250], [250, 430]],
    // 'density/stp': [[0.0899, 5], [5, 22590]],
    // 'density/stp': [[0.0899, 225], [225, 22590]],
    'density/stp': [[0.0899, 2.25], [2.25, 22590]],
    'ionization_energies/0': [[357.7, 2372.3]],
    'melting_point': [[0.95, 100], [100, 3823]],
    'electron_affinity': [[-116, 348.575]],
    'discovered/year': [[-8000, 1650], [1650, 1925]]
}