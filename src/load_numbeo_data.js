import * as d3 from "d3";

export async function load_data() {
    console.log("loading_data")
    let data = await d3.csv("../country_indices.csv");
    console.log(data)
    let filtered_data = data.filter(row => row["quality_of_life_index"] !== "-1")

    let dimensions = [
        'crime_index', 'traffic_index', 'rent_index', 'groceries_index',
        'restaurant_price_index', 'pollution_index', 'health_care_index', 'quality_of_life_index']


    var indices_ranges = {
        'crime_index': [0, 100],
        'traffic_index': [0, 320],//unbounded max
        'rent_index': [0, 80],//unbounded max, 100 is new york
        'groceries_index': [0, 150],//unbounded max, 100 is new york
        'restaurant_price_index': [0, 125],//unbounded max, 100 is new york
        'pollution_index': [0, 100],//actual values seem to be going to 113?
        'health_care_index': [0, 100],
        'quality_of_life_index': [0, 200],//unbounded

        'traffic_time_index': [0, 100],//unboundex max?
        'purchasing_power_incl_rent_index': [0, 150],//unbounded max, 100 is new york
        'cpi_index': [0, 150],//unbounded max, 100 is new york
        'cpi_and_rent_index': [0, 200],//unbounded max, 100 is new york
        'safety_index': [100, 0],
        'traffic_co2_index': [0, 30000],//unbounded max
        'traffic_inefficiency_index': [0, 700],//unbounded max
        'property_price_to_income_ratio': [0, 150],//unbounded max
        'climate_index': [-100, 100]
    }

    return {
        data: filtered_data,
        dimensions,
        dimension_ranges: indices_ranges,
    }
}

