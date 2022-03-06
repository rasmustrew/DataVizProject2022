import * as d3 from "d3";

export async function load_animal_data() {
    let data = await d3.csv("../data/animal_population.csv");
    let float_dimensions = [
        'Overall Sample Size ', 'Overall MLE', 'Overall CI - lower', 'Overall CI - upper',
        'Male Sample Size', 'Male MLE', 'Male CI - lower', 'Male CI - upper']
    let id_dimension = "Species Common Name"
    let error_values = [""]

    let row_filtered_data = data.filter(row => {
        return float_dimensions.every(dimension => {
            return !error_values.includes(row[dimension])
        })
    })

    // let row_filtered_data = data.filter(row => row["GDP: Gross domestic product (million current US$)"] !== "-99")
    // row_filtered_data = row_filtered_data.filter(row => row["Surface area (km2)"] !== "-99");

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
    })

    return {
        data: column_filtered_data,
        dimensions: float_dimensions,
    }
}

