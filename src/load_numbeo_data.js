import * as d3 from "d3";

export async function load_data() {
    let data = await d3.csv("../country_indices.csv");
    let float_dimensions = [
        'crime_index', 'traffic_index', 'rent_index', 'groceries_index',
        'restaurant_price_index', 'pollution_index', 'health_care_index', 'quality_of_life_index']
    let dimensions = float_dimensions.concat(["name"]);


    let filtered_data = data.filter(row => row["quality_of_life_index"] !== "-1")

    filtered_data = filtered_data.map(row => {
        let filtered_row = {}
        dimensions.forEach(dimension => {
            filtered_row[dimension] = row[dimension]
        })
        return filtered_row
    })

    filtered_data.forEach(row => {
        float_dimensions.forEach(dimension => {
            row[dimension] = parseFloat(row[dimension])
        })
    })

    return {
        data: filtered_data,
        dimensions: float_dimensions,
    }
}

