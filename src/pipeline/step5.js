import * as d3 from "d3";

export const read_tick_density = () => ((1 - parseInt(d3.select("#tick_density input").property("value")) / 100) ** 2) / 2

export const read_gap_size = () => parseInt(d3.select("#gap_size input").property("value"))

export const read_density_cues = () => d3.select("#density_cues input").property("checked")

export const read_step_5 = () => {
    console.log("read step 5")
    return {
        gap_size: read_gap_size(),
        tick_density: read_tick_density(),
        use_density_cues: read_density_cues(),
    }
}