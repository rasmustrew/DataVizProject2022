import * as d3 from "d3";

export async function load_heatmap_data(suffix) {
    let data = await d3.csv("../data/heatmap_" + suffix + ".csv")
    return {
        data: data,
        // x and y axes cannot be split in a heatmap
        dimensions: data.columns.filter(col => col !== "x" && col !== "y")
    }
}