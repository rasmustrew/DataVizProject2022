import {data_selection_map, get_selected_data} from "./ui/data_selection";
import {get_selected_dimensions, set_up_dimensions_selector} from "./ui/dimension_selection";
import {algorithm_selection_update, get_selected_algorithm} from "./ui/algorithm_selection";
import {get_chart_selection, get_selected_chart} from "./ui/chart_selection";
import {update_metrics_display} from "./ui/metric_display";

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
        mappers[dimension] = algo(sorted_data[dimension], args)
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
