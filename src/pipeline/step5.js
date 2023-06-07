import * as d3 from "d3";

export const read_tick_density = () => (1 - parseInt(d3.select("#tick_density input").property("value")) / 100) ** 2 / 2

export const read_gap_size = () => parseInt(d3.select("#gap_size input").property("value"))