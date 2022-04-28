import * as d3 from "d3";

export async function load_periodic_table_data() {
    let data = await d3.csv("../data/periodic_table.csv");
    // let float_dimensions = [
    //     'boiling_point',
    //     'abundance/universe',
    //     'conductivity/thermal',
    //     'density/stp',
    //     'ionization_energies/0',
    //     'melting_point',
    //     'electron_affinity',
    //     'discovered/year'
    // ]
    let float_dimensions = [
        'ionization_energies/0',
        'abundance/universe',
        'density/stp',
        'conductivity/thermal',
        'discovered/year',
    ]
    let id_dimension = "name"
    let error_values = ["", "0"]


    let row_filtered_data = data.filter(row => {
        return float_dimensions.every(dimension => {
            return !error_values.includes(row[dimension])
        })
    })

    // let row_filtered_data = data.filter(row => row["GDP: Gross domestic product (million current US$)"] !== "-99")
    // row_filtered_data = row_filtered_data.filter(row => row["Surface area (km2)"] !== "-99");

    console.log(data)
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

