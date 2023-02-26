import * as d3 from "d3";

export async function load_heatmap_data(suffix) {
    return {
        data: await d3.csv("../data/heatmap_" + suffix + ".csv"),
        dimensions: ["group", "variable", "value"]
    }
}