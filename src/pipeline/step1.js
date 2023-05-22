import * as d3 from "d3";

const step1_selector_ref = "#step1_select";
let read_number_of_clusters = () => parseInt(d3.select("#clusters input").property("value"))
let read_fragmentation = () => 1 - (parseInt(d3.select("#fragmentation input").property("value")) / 100)
export const step1_selection_map = {
    custom_choice_k: {
        arguments_id: ["#clusters"],
        algo: custom_choice_k,
        read_args: read_number_of_clusters
    },
    cost_reduction_threshold: {
        arguments_id: ["#fragmentation"],
        algo: cost_reduction_threshold,
        read_args: read_fragmentation
    },
    cost_threshold: {
        arguments_id: ["#fragmentation"],
        algo: cost_threshold,
        read_args: read_fragmentation
    }
}


export function get_selected_step1_algorithm() {
    return step1_selection_map[d3.select(step1_selector_ref).property("value")]
}

function custom_choice_k(callback_data, k) {
    return callback_data.num_splits < k
}

function cost_threshold(callback_data, fragmentation_weight) {
    console.log("THRESHOLD")
    console.log(callback_data)
    console.log(fragmentation_weight)
    let threshold = (fragmentation_weight/2) ** 4 + 0.001 * callback_data.num_splits
    return (callback_data.cost_now / callback_data.data_length) >= threshold
}

function cost_reduction_threshold(callback_data, fragmentation_weight) {
    console.log("COST REDUCTION")
    console.log(callback_data)
    console.log(fragmentation_weight)
    let cost_reduction = (callback_data.cost_previous - callback_data.cost_now) / callback_data.data_length
    let reduction_threshold = fragmentation_weight ** 2 + 0.001 * callback_data.num_splits
    return cost_reduction >= reduction_threshold
}