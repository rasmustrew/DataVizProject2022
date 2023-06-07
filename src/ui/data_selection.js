import {load_periodic_table_data} from "../data/load_periodic_table_data";
import {load_un_data} from "../data/load_un_data";
import {load_heatmap_data} from "../data/load_heatmap_csv";
import * as d3 from "d3";
import {load_numbeo_data} from "../data/load_numbeo_data";
import {load_mouse_data} from "../data/load_mouse_data";
import {load_AA_comparison_data} from "../data/load_AA_comparison_data";

const data_selector_ref = "#data-select";

const data_selection_map = {
    AA_comparison: load_AA_comparison_data,
    periodic_table: load_periodic_table_data,
    un_country_data: load_un_data,
    numbeo_country_data: load_numbeo_data,
    heatmap_data: () => load_heatmap_data("data"),
    heatmap_denmark: () => load_heatmap_data("denmark"),
    heatmap_europe: () => load_heatmap_data("europe"),
    mouse_dna: load_mouse_data,
    monotonicity_example: () => {return {data: [{"v": 0}, {"v": 2}, {"v": 3}, {"v": 7}, {"v": 8}, {"v": 10}], dimensions: ["v"]}}
}

export async function prepare_data_set(data_selection) {

    let data_function = data_selection_map[data_selection]
    let {data, dimensions} = await data_function();

    let sorted_data = {}
    for (let dimension of dimensions) {
        let data_values = data.map(value => value[dimension])
        data_values.sort(function (a, b) {
            return a - b;
        });
        sorted_data[dimension] = data_values
    }

    let data_per_dimension = {}
    dimensions.forEach((dim) => {
        data_per_dimension[dim] = data.map((data_point) => data_point[dim])
    })
    return {data, dimensions, sorted_data, data_per_dimension}
}


export async function get_selected_data() {
    let selection = d3.select(data_selector_ref).property("value")
    return await prepare_data_set(selection)
}