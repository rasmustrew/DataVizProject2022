import * as d3 from "d3";

export async function load_un_data() {
    let data = await d3.csv("../data/un_country_data.csv");
    let float_dimensions = [
        'Surface area (km2)',
        'Population in thousands (2017)',
        'Population density (per km2, 2017)',
        'GDP: Gross domestic product (million current US$)',
        'GDP per capita (current US$)',
        'International trade: Imports (million US$)',
        'International trade: Exports (million US$)',
        'International trade: Balance (million US$)',
        'GDP growth rate (annual %, const. 2005 prices)']
    let id_dimension = "country"
    let error_values = ["-99", "..."]

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

