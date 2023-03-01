const dim_selector_ref = "#dimension-select";
import * as d3 from "d3";

export function set_up_dimensions_selector(dimensions) {
    let dimension_selector = document.getElementById("dimension-select")
    while (dimension_selector.firstChild) {
        dimension_selector.removeChild(dimension_selector.firstChild)
    }
    for (let dimension of dimensions) {
        const optionElement = document.createElement('option');
        optionElement.value = dimension;
        optionElement.text = dimension;
        optionElement.setAttribute("selected", "")
        dimension_selector.appendChild(optionElement);
    }
}

export function get_selected_dimensions() {
    let selected_options = Array.from(d3.select(dim_selector_ref).property("selectedOptions"))
    let selection = selected_options.map((option) => option.value)
    return selection
}

