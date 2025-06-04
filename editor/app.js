// Import necessary modules from CodeMirror
// Using esm.sh as a CDN for direct ES module imports
import { EditorState } from "https://esm.sh/@codemirror/state@6.4.1";
import { EditorView, keymap, lineNumbers, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, highlightActiveLineGutter } from "https://esm.sh/@codemirror/view@6.26.3";
import { javascript } from "https://esm.sh/@codemirror/lang-javascript@6.2.2";
import { defaultKeymap, history, indentWithTab } from "https://esm.sh/@codemirror/commands@6.6.0";
import { syntaxHighlighting, defaultHighlightStyle, HighlightStyle } from "https://esm.sh/@codemirror/language@6.10.1";
import { oneDark } from "https://esm.sh/@codemirror/theme-one-dark@6.1.4"; // A popular dark theme
import { tags } from "https://esm.sh/@lezer/highlight@1.2.0";


// DOM Elements
const editorContainer = document.getElementById('editor-container');
const consoleOutput = document.getElementById('console-output');
const runButton = document.getElementById('run-button');
const downloadButton = document.getElementById('download-button');
const resizer = document.getElementById('resizer');
const consoleContainer = document.getElementById('console-container');

// Initial Code
const initialCode = [
    '// Welcome to your JavaScript IDE (CodeMirror 6)!',
    'console.log("Hello, world!");',
    '',
    'function greet(name) {',
    '  return "Hi, " + name + "!";',
    '}',
    '',
    'console.log(greet("Developer"));',
    'for (let i = 0; i < 5; i++) {',
    '   console.log("Count: " + i);',
    '}'
].join('\n');

// Custom theme adjustments for purple accents (optional, oneDark is already good)
// You can define your own HighlightStyle or extend oneDark
const purpleAccentHighlightStyle = HighlightStyle.define([
    { tag: tags.keyword, color: "#C586C0" }, // Example: Making keywords a bit more purple
    { tag: tags.controlKeyword, color: "#D16D9A" },
    { tag: tags.operatorKeyword, color: "#D16D9A" },
    { tag: tags.definitionKeyword, color: "#C586C0"},
    { tag: tags.comment, color: "#6A9955", fontStyle: "italic" },
    { tag: tags.string, color: "#CE9178" },
    { tag: tags.number, color: "#b5cea8"},
    { tag: tags.bool, color: "#569cd6"},
    { tag: tags.variableName, color: "#9CDCFE"},
    { tag: tags.definition(tags.variableName), color: "#4FC1FF" },
    { tag: tags.function(tags.variableName), color: "#DCDCAA" },
    { tag: tags.propertyName, color: "#DCDCAA"},
    // You can add more specific purple accents here
]);


// CodeMirror 6 Setup
const state = EditorState.create({
    doc: initialCode,
    extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        syntaxHighlighting(defaultHighlightStyle, {fallback: true}), // Using default or customize
        syntaxHighlighting(purpleAccentHighlightStyle), // Add our purple accents
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        keymap.of([
            ...defaultKeymap,
            indentWithTab // Make Tab key indent
        ]),
        javascript(), // JavaScript language support
        oneDark, // Apply the oneDark theme
        EditorView.lineWrapping, // Enable line wrapping
        // Custom listener to update layout on resize (might not be strictly necessary with flex)
        EditorView.updateListener.of(update => {
            if (update.geometryChanged) {
                // Useful if you need to react to CM6 internal geometry changes
            }
        })
    ]
});

const editorView = new EditorView({
    state: state,
    parent: editorContainer
});


// Function to log messages to the custom console
function logToConsole(message, type = 'log') {
    const entry = document.createElement('div');
    // Simple stringification for objects, consider a more robust solution for complex objects
    if (typeof message === 'object' && message !== null) {
        try {
            message = JSON.stringify(message, null, 2);
        } catch (e) {
            message = "[Unserializable Object]";
        }
    } else {
        message = String(message);
    }

    entry.textContent = message;

    if (type === 'error') {
        entry.style.color = '#ff6b6b'; // Red for errors
    } else if (type === 'warn') {
        entry.style.color = '#ffa500'; // Orange for warnings
    } else if (type === 'info') {
        entry.style.color = '#64b5f6'; // Blue for info
    }
    consoleOutput.appendChild(entry);
    consoleContainer.scrollTop = consoleContainer.scrollHeight; // Auto-scroll
}

// Override console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;
const originalConsoleClear = console.clear;


console.log = (...args) => {
    originalConsoleLog.apply(console, args);
    logToConsole(args.join(' '));
};
console.error = (...args) => {
    originalConsoleError.apply(console, args);
    logToConsole(args.join(' '), 'error');
};
console.warn = (...args) => {
    originalConsoleWarn.apply(console, args);
    logToConsole(args.join(' '), 'warn');
};
console.info = (...args) => {
    originalConsoleInfo.apply(console, args);
    logToConsole(args.join(' '), 'info');
};
console.clear = () => {
    originalConsoleClear.apply(console);
    consoleOutput.innerHTML = '';
    logToConsole("Console was cleared.", "info");
};


// Run button functionality
runButton.addEventListener('click', () => {
    consoleOutput.innerHTML = ''; // Clear previous output
    const code = editorView.state.doc.toString(); // Get code from CodeMirror
    try {
        new Function(code)();
    } catch (error) {
        console.error('Error:', error.message, error.stack);
    }
});

// Download button functionality
downloadButton.addEventListener('click', () => {
    const code = editorView.state.doc.toString(); // Get code from CodeMirror
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'script.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Resizer functionality (should largely remain the same)
let isResizing = false;

function startResize(e) {
    isResizing = true;
    // Add appropriate move/end listeners based on event type
    if (e.type === 'mousedown') {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResize);
    } else if (e.type === 'touchstart') {
        document.addEventListener('touchmove', handleMouseMove, { passive: false });
        document.addEventListener('touchend', stopResize);
    }
    e.preventDefault();
}

resizer.addEventListener('mousedown', startResize);
resizer.addEventListener('touchstart', startResize, { passive: false });


function handleMouseMove(e) {
    if (!isResizing) return;

    const containerRect = document.querySelector('.container').getBoundingClientRect();
    const editorMinHeight = 100; // px
    const consoleMinHeight = 50; // px

    const clientY = e.clientY !== undefined ? e.clientY : e.touches[0].clientY;

    let newEditorHeight = clientY - containerRect.top - (resizer.offsetHeight / 2);

    if (newEditorHeight < editorMinHeight) {
        newEditorHeight = editorMinHeight;
    }

    let newConsoleHeight = containerRect.height - newEditorHeight - resizer.offsetHeight;

    if (newConsoleHeight < consoleMinHeight) {
        newConsoleHeight = consoleMinHeight;
        newEditorHeight = containerRect.height - newConsoleHeight - resizer.offsetHeight;
        if (newEditorHeight < editorMinHeight) newEditorHeight = editorMinHeight; // Recalc if console pushed editor too small
    }

    editorContainer.style.height = `${newEditorHeight}px`;
    consoleContainer.style.height = `${newConsoleHeight}px`;

    // CodeMirror 6 is generally responsive and might not need an explicit layout refresh here.
    // Its `EditorView.updateListener` or its internal ResizeObserver should handle it.
    // If you observe issues, you might need to dispatch a view update, but try without first.
}

function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResize);
    document.removeEventListener('touchmove', handleMouseMove);
    document.removeEventListener('touchend', stopResize);
}

// No explicit editor.layout() needed like in Monaco.
// CodeMirror 6's View should handle container resizes.
