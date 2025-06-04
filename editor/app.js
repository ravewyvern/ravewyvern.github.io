require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.47.0/min/vs' }});
require(['vs/editor/editor.main'], function() {
    const editorContainer = document.getElementById('editor-container');
    const consoleOutput = document.getElementById('console-output');
    const runButton = document.getElementById('run-button');
    const downloadButton = document.getElementById('download-button');
    const resizer = document.getElementById('resizer');
    const consoleContainer = document.getElementById('console-container');

    // Initialize Monaco Editor
    const editor = monaco.editor.create(editorContainer, {
        value: [
            '// Welcome to your JavaScript IDE!',
            'console.log("Hello, world!");',
            '',
            'function greet(name) {',
            '  return "Hi, " + name + "!";',
            '}',
            '',
            'console.log(greet("Developer"));'
        ].join('\n'),
        language: 'javascript',
        theme: 'vs-dark', // Built-in dark theme
        automaticLayout: true, // Adjusts editor layout on container resize
        roundedSelection: true,
        padding: {
            top: 10,
            bottom: 10
        }
    });

    // Function to log messages to the custom console
    function logToConsole(message, type = 'log') {
        const entry = document.createElement('div');
        entry.textContent = message;
        if (type === 'error') {
            entry.style.color = '#ff6b6b'; // Red for errors
        } else if (type === 'warn') {
            entry.style.color = '#ffa500'; // Orange for warnings
        }
        consoleOutput.appendChild(entry);
        consoleContainer.scrollTop = consoleContainer.scrollHeight; // Auto-scroll
    }

    // Override console methods
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.log = (...args) => {
        originalConsoleLog.apply(console, args);
        logToConsole(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' '));
    };
    console.error = (...args) => {
        originalConsoleError.apply(console, args);
        logToConsole(args.join(' '), 'error');
    };
    console.warn = (...args) => {
        originalConsoleWarn.apply(console, args);
        logToConsole(args.join(' '), 'warn');
    };


    // Run button functionality
    runButton.addEventListener('click', () => {
        consoleOutput.innerHTML = ''; // Clear previous output
        const code = editor.getValue();
        try {
            // Use a Function constructor for safer evaluation in the browser context
            // This provides a scope that's separate from the global scope of this script
            new Function(code)();
        } catch (error) {
            console.error('Error:', error.message);
        }
    });

    // Download button functionality
    downloadButton.addEventListener('click', () => {
        const code = editor.getValue();
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

    // Resizer functionality
    let isResizing = false;

    resizer.addEventListener('mousedown', startResize);
    resizer.addEventListener('touchstart', startResize);

    function startResize(e) {
        isResizing = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchmove', handleMouseMove);
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('touchend', stopResize);
        e.preventDefault(); // Prevent text selection and other unwanted behaviors
    }

    function handleMouseMove(e) {
        if (!isResizing) return;

        const containerRect = document.querySelector('.container').getBoundingClientRect();
        const editorMinHeight = 100; // px
        const consoleMinHeight = 50; // px

        // Get the Y coordinate based on the event type (mouse or touch)
        const clientY = e.clientY !== undefined ? e.clientY : e.touches[0].clientY;

        // Calculate the desired top position of the console (bottom of the editor)
        // relative to the container's top.
        let newEditorHeight = clientY - containerRect.top - (resizer.offsetHeight / 2);

        // Ensure editor doesn't get too small
        if (newEditorHeight < editorMinHeight) {
            newEditorHeight = editorMinHeight;
        }

        // Calculate console height based on new editor height and container height
        let newConsoleHeight = containerRect.height - newEditorHeight - resizer.offsetHeight;

        // Ensure console doesn't get too small
        if (newConsoleHeight < consoleMinHeight) {
            newConsoleHeight = consoleMinHeight;
            // Adjust editor height if console hit its minimum
            newEditorHeight = containerRect.height - newConsoleHeight - resizer.offsetHeight;
        }


        editorContainer.style.height = `${newEditorHeight}px`;
        consoleContainer.style.height = `${newConsoleHeight}px`;

        // Monaco editor needs to be explicitly told to layout again when its container resizes
        editor.layout();
    }

    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('touchmove', handleMouseMove);
        document.removeEventListener('mouseup', stopResize);
        document.removeEventListener('touchend', stopResize);
        editor.layout(); // Optional: Recalculate editor layout if needed after resize
    }

    // Initial layout call for editor
    editor.layout();
});
