import * as d3 from "d3";

export async function load_AA_comparison_data() {
    let data = await d3.csv("./data/AA_comparison_data.csv");
    let float_dimensions = ['A', 'B']
    let id_dimension = "name"

    data.forEach(row => {
        float_dimensions.forEach(dimension => {
            row[dimension] = parseFloat(row[dimension])
        })
    })

    data.forEach((row, index) => {
        row["id"] = data[index][id_dimension]
    })

    return {
        data: data,
        dimensions: float_dimensions,
    }
}

