import * as d3 from "d3";

export async function load_data() {
    console.log("loading_data")
    let data = await d3.csv("../country_indices.csv");
    console.log(data)
    let filtered_data = data.filter(row => row["quality_of_life_index"] !== "-1")

    let dimensions = [
        'crime_index', 'traffic_index', 'rent_index', 'groceries_index',
        'restaurant_price_index', 'pollution_index', 'health_care_index', 'quality_of_life_index']


    return {
        data: filtered_data,
        dimensions,
    }
}

