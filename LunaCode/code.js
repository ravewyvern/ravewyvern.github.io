const statesEl = document.getElementById("states");
const saveStateEl = document.getElementById("saveState");
const loadStateEl = document.getElementById("loadState");
const oneDarkEl = document.getElementById("oneDark");
// Create an initial state for the view
const initialState = cm6.createEditorState("function foo() {\n    console.log(123);\n}");
const view = cm6.createEditorView(initialState, document.getElementById("editor"));
let states = { "Initial State": initialState };

view.setState(initialState);

let button = document.querySelector("#search");
button.addEventListener("click", () => {
    cm6.openSearchPanel(view);
})

function populateSelect() {
    statesEl.innerHTML = "";

    for (let key of Object.keys(states)) {
        var option = document.createElement("option");
        option.value = key;
        option.text = key;
        statesEl.appendChild(option);
    }
}

function changeTheme() {
    let options = {
        oneDark: oneDarkEl.checked,
    };

    let newState = cm6.createEditorState(view.state.doc, options);
    view.setState(newState);
}

let stateNum = 1;
function saveState() {
    let stateName = `Saved State ${stateNum++}`;
    states[stateName] = view.state;
    populateSelect();
    statesEl.value = stateName;
}

function loadState() {
    view.setState(states[statesEl.value])
}

populateSelect();