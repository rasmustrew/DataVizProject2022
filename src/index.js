import {data_selection_map, get_selected_data} from "./ui/data_selection";
import {get_selected_dimensions, set_up_dimensions_selector} from "./ui/dimension_selection";
import {algorithm_selection_update, get_selected_algorithm} from "./ui/algorithm_selection";
import {get_chart_selection, get_selected_chart} from "./ui/chart_selection";
import {update_metrics_display} from "./ui/metric_display";
import {hardcoded_periodic_table_get_mapper} from "./algorithms/hardcoded_splits";
import LinearMapper from "./mappings/linear_mapping";
import CompositeMapper from "./mappings/composite_mapping";
import {greedy_guided_split} from "./algorithms/greedy_guided_split/greedy_guided_split";

console.log("starting")

const chart_container_ref = "#plot_container_id";
let data, dimensions, sorted_data, selected_dimensions, mappers, selected_chart_generator

function select_chart() {
    document.querySelector(chart_container_ref).innerHTML = ""
    selected_chart_generator = get_selected_chart()
    selected_chart_generator(chart_container_ref, data, selected_dimensions, mappers)
}

function select_algorithm() {
    let {algo, arguments_id, read_args} = get_selected_algorithm()
    algorithm_selection_update(arguments_id)
    let args = read_args()
    mappers = {}
    for (let dimension of dimensions) {
        mappers[dimension] = algo(sorted_data[dimension], args, dimension)
    }
    let dimension = dimensions[0]
    update_metrics_display(sorted_data[dimension], mappers[dimension])
}

function select_dimensions() {
    selected_dimensions = get_selected_dimensions()
}

async function select_data() {
    let selected_data = await get_selected_data()
    data = selected_data.data
    dimensions = selected_data.dimensions
    sorted_data = selected_data.sorted_data

    set_up_dimensions_selector(dimensions)
}

window.select_chart = () => {
    select_chart()
}

window.select_algorithm = () => {
    select_algorithm();
    select_chart();
}

window.select_dimensions = () => {
    select_dimensions();
    select_algorithm();
    select_chart();
}

window.select_data = async () => {
    await select_data();
    select_dimensions();
    select_algorithm();
    select_chart();
}

window.on_recompute_button = () => {
    select_algorithm();
    select_chart();
}


async function init() {
    await select_data();
    select_dimensions();
    select_algorithm();
    select_chart();
}

init()
// let my_data = [
//     8e-9,
//     1e-8,
//     1e-8,
//     2e-8,
//     2e-8,
//     3e-8,
//     4e-8,
//     4e-8,
//     5e-8,
//     5e-8,
//     5e-8,
//     5e-8,
//     5e-8,
//     6e-8,
//     6e-8,
//     6e-8,
//     7e-8,
//     7e-8,
//     8e-8,
//     1e-7,
//     1e-7,
//     1e-7,
//     1e-7,
//     2e-7,
//     2e-7,
//     2e-7,
//     2e-7,
//     2e-7,
//     2e-7,
//     2e-7,
//     2e-7,
//     2e-7,
//     2e-7,
//     3e-7,
//     4e-7,
//     4e-7,
//     5e-7,
//     5e-7,
//     5e-7,
//     6e-7,
//     7e-7,
//     7e-7,
//     8e-7,
//     9e-7,
//     0.000001,
//     0.000001,
//     0.000001,
//     0.000001,
//     0.000001,
//     0.000001,
//     0.000001,
//     0.000003,
//     0.000003,
//     0.000004,
//     0.000004,
//     0.000005,
//     0.000006,
//     0.00002,
//     0.00003,
//     0.00004,
//     0.0001,
//     0.0001,
//     0.0003,
//     0.0003,
//     0.0003,
//     0.0007,
//     0.0008,
//     0.0015,
//     0.002,
//     0.005,
//     0.006,
//     0.007,
//     0.02,
//     0.05,
//     0.06,
//     0.07,
//     0.1,
//     0.11,
//     0.13,
//     0.5,
//     1,
//     23,
//     75
// ]
// let mapper = hardcoded_periodic_table_get_mapper(my_data, {}, "abundance/universe")
// let mapperToSameRange = new LinearMapper(mapper.get_output_space_ranges(), [8e-9, 75])
// let combined_mapper = new CompositeMapper([mapper, mapperToSameRange])
// let transformed_data = my_data.map((data_point) => combined_mapper.map(data_point))
//
// let split_points = [8e-9, 0.0009273414413707938, 0.13437282585692462, 1.2912620979636045, 75]
// let transformed_split_points = split_points.map((data_point) => combined_mapper.map(data_point))
// console.log(transformed_data)
// console.log(transformed_split_points)
//
//
//
//
// let ggs_mapper = greedy_guided_split(my_data, {distortion: 1, fragmentation: 0.04, skewness: 2}, 'abundance/universe')
// console.log(ggs_mapper.get_input_space_ranges())
// let ggs_split_points = [
//     8e-9,
//     4e-7,
//     0.0015,
//     75
// ]
//
// let ggs_mapper_to_same_range = new LinearMapper(ggs_mapper.get_output_space_ranges(), [8e-9, 75])
// let ggs_combined_mapper = new CompositeMapper([ggs_mapper, ggs_mapper_to_same_range])
//
// let transformed_ggs_split_points = ggs_split_points.map((data_point) => ggs_combined_mapper.map(data_point))
// let transformed_ggs_data = my_data.map((data_point) => ggs_combined_mapper.map(data_point))
// console.log(transformed_ggs_split_points)
// console.log(transformed_ggs_data)
