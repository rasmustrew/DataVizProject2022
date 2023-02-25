import * as d3 from "d3";

export async function load_heatmap_data(suffix) {
    return d3.csv("../data/heatmap_" + suffix + ".csv")
}