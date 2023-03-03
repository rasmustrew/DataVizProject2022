import * as d3 from "d3";

export async function load_heatmap_data(suffix) {
    let data = await d3.csv("./data/heatmap_" + suffix + ".csv")
    let dimensions = data.columns.filter(col => col !== "x" && col !== "y")
    const rows = data.length;
    for (let i = 0; i < rows; i++) {
        for (const dimension of dimensions) {
            data[i][dimension] = parseInt(data[i][dimension]);
        }
    }
    return {
        data: data,
        // x and y axes cannot be split in a heatmap
        dimensions: dimensions
    }
}