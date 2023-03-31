import {load_periodic_table_data} from "../data/load_periodic_table_data";
import {load_un_data} from "../data/load_un_data";
import {load_heatmap_data} from "../data/load_heatmap_csv";
import * as d3 from "d3";
import {load_numbeo_data} from "../data/load_numbeo_data";

const data_selector_ref = "#data-select";

const data_selection_map = {
    periodic_table: load_periodic_table_data,
    un_country_data: load_un_data,
    numbeo_country_data: load_numbeo_data,
    heatmap_data: () => load_heatmap_data("data"),
    heatmap_denmark: () => load_heatmap_data("denmark"),
    heatmap_europe: () => load_heatmap_data("europe"),
    monotonicity_example: () => {return {data: [{"v": 0}, {"v": 2}, {"v": 3}, {"v": 7}, {"v": 8}, {"v": 10}], dimensions: "v"}}
}

async function prepare_data_set(data_selection) {

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
    return {data, dimensions, sorted_data}
}


export async function get_selected_data() {
    let selection = d3.select(data_selector_ref).property("value")
    return await prepare_data_set(selection)
}