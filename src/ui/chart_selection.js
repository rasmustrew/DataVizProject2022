import SPC from "../plots/spc";
import HeatMap from "../plots/heatmap";
import Choropleth from "../plots/choropleth";
import Lollipop from "../plots/lollipop";
import * as d3 from "d3";

const chart_selector_ref = "#chart-select";

let chart_selection_map = {
    spc: (chart_container_ref, data, dimensions, mappers) => {
        let spc = new SPC(chart_container_ref, data, dimensions, mappers)
        spc.draw()
    },
    heatmap: (chart_container_ref, data, dimensions, mappers) => {
        // let data_selector = document.querySelector(data_selector_ref)
        // if (!data_selector.value.toString().includes("heatmap")) {
        //     data_selector.selectedIndex = 2
        //     update_data_set().then(() => {
        //         new HeatMap(chart_container_ref, data_source.data, data_source.mappers, selected_dimension)
        //     })
        // } else {
        //     new HeatMap(chart_container_ref, arg_data_source.data, arg_data_source.mappers, arg_selected_dimension)
        // }
        new HeatMap(chart_container_ref, data, mappers, dimensions[0])
    },
    choropleth: (chart_container_ref, data, dimensions, mappers) => {
        new Choropleth(chart_container_ref, data, mappers)
    },
    lollipop: (chart_container_ref, data, dimensions, mappers) => {
        new Lollipop(chart_container_ref, data, dimensions[0], mappers[dimensions[0]])
    }
}

export function get_selected_chart() {
    return chart_selection_map[d3.select(chart_selector_ref).property("value")]
}