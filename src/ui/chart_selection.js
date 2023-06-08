import SPC from "../plots/spc";
import HeatMap from "../plots/heatmap";
import Choropleth from "../plots/choropleth";
import Lollipop from "../plots/lollipop";
import * as d3 from "d3";
import ScatterPlot from "../plots/scatterplot";
import {v4 as uuidv4} from "uuid";
import Beeswarm from "../plots/beeswarm";

const chart_selector_ref = "#chart-select";

function make_chart_div(container_ref, chart_class="chart") {
    let container = document.querySelector(container_ref)
    let plot = document.createElement("div")
    plot.classList.add(chart_class)
    plot.id = "plot_id_" + uuidv4()
    let ref = "#" + plot.id
    container.appendChild(plot)
    return ref
}


let chart_selection_map = {
    spc: (chart_container_ref, data, dimensions, mappers, args) => {
        let spc = new SPC(chart_container_ref, data, dimensions, mappers, args)
        spc.draw()
    },
    heatmap: (chart_container_ref, data, dimensions, mappers, args) => {
        let chart_ref = make_chart_div(chart_container_ref)
        new HeatMap(chart_ref, data, mappers, dimensions[0])
    },
    choropleth: (chart_container_ref, data, dimensions, mappers, args) => {
        let chart_ref = make_chart_div(chart_container_ref)
        new Choropleth(chart_ref, data, dimensions[0], mappers)
    },
    lollipop: (chart_container_ref, data, dimensions, mappers, args) => {
        let chart_ref = make_chart_div(chart_container_ref, "lollipop")
        let chosen_dimension = dimensions[0]
        new Lollipop(chart_ref, data, chosen_dimension, mappers[chosen_dimension], args)
    },
    scatter_plot:  (chart_container_ref, data, dimensions, mappers, args) => {
        let chart_ref = make_chart_div(chart_container_ref)
        let chosen_dimensions = dimensions.slice(0, 3)
        new ScatterPlot(chart_ref, data, chosen_dimensions, mappers, args)
    },
    beeswarm:  (chart_container_ref, data, dimensions, mappers, args) => {
    let chart_ref = make_chart_div(chart_container_ref, "beeswarm")
    let chosen_dimension = dimensions[0]
    new Beeswarm(chart_ref, data, chosen_dimension, mappers[chosen_dimension], 8, args)
},
}

export function get_selected_chart() {
    return chart_selection_map[d3.select(chart_selector_ref).property("value")]
}