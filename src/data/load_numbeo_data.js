import * as d3 from "d3";

export async function load_numbeo_data() {
    let data = await d3.csv("./data/country_indices.csv");
    let float_dimensions = [
        'crime_index', 'traffic_index', 'rent_index', 'groceries_index',
        'restaurant_price_index', 'pollution_index', 'health_care_index', 'quality_of_life_index']
    let id_dimension = "name"

    let error_values = ["", "-1"]


    let row_filtered_data = data.filter(row => {
        return float_dimensions.every(dimension => {
            return !error_values.includes(row[dimension])
        })
    })

    let column_filtered_data = row_filtered_data.map(row => {
        let filtered_row = {}
        float_dimensions.forEach(dimension => {
            filtered_row[dimension] = row[dimension]
        })
        return filtered_row
    })

    column_filtered_data.forEach(row => {
        float_dimensions.forEach(dimension => {
            row[dimension] = parseFloat(row[dimension])
        })
    })

    column_filtered_data.forEach((row, index) => {
        row["id"] = row_filtered_data[index][id_dimension]
        row["code"] = row_filtered_data[index]["iso3"]
    })

    return {
        data: column_filtered_data,
        dimensions: float_dimensions
    }
}

