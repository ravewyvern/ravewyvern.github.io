// main.js

let _printBuffer = '';

// --- CONFIGURATION ---
// Set to true when packaging as a browser extension to disable adding new extensions.
const browserExtensionMode = false;
const defaultExtensionFiles = ['math.json']; // Add more filenames here, e.g., 'text.json'

const STORAGE_KEYS = {
    code: 'novaScriptCode',
    customExtensions: 'novaScriptCustomExtensions',
    projectName: 'novaScriptProjectName'
};

const extensionRegistry = {};
const loadedPacks = {}; // Holds full pack info for display
let customExtensions = [];
let currentFileHandle = null; // Stores the handle to the currently open file
let isDirty = false; // Tracks if there are unsaved changes
async function loadInitialData() {
    // 1. Load default extensions from files
    for (const fileName of defaultExtensionFiles) {
        try {
            const response = await fetch(`extensions/${fileName}`);
            if (!response.ok) throw new Error(`Network error loading ${fileName}`);
            const pack = await response.json();
            pack.isDefault = true; // Mark default packs
            loadExtensionPack(pack);
        } catch (error) {
            console.error(`Failed to load default extension ${fileName}:`, error);
        }
    }

    // 2. Load custom extensions from localStorage
    const savedExtensions = localStorage.getItem(STORAGE_KEYS.customExtensions);
    if (savedExtensions) {
        customExtensions = JSON.parse(savedExtensions);
        customExtensions.forEach(packJson => {
            try {
                // The pack itself is already a parsed object here
                loadExtensionPack(packJson);
            } catch (e) {
                console.error("Failed to load a custom extension from storage:", e);
            }
        });
    }
}

async function loadDefaultExtensions() {
    for (const fileName of defaultExtensionFiles) {
        try {
            const response = await fetch(`extensions/${fileName}`);
            if (!response.ok) {
                throw new Error(`Network response was not ok for ${fileName}`);
            }
            const pack = await response.json();
            loadExtensionPack(pack);
        } catch (error) {
            console.error(`Failed to load default extension ${fileName}:`, error);
        }
    }
}

function loadExtensionPack(pack) {
    // MODIFIED: Check for the new 'id' field
    if (!pack.info || !pack.info.id || !pack.functions) {
        throw new Error("Invalid extension pack: Missing 'info.id' or 'functions'.");
    }
    // MODIFIED: Use the ID to check for conflicts
    if (loadedPacks[pack.info.id]) {
        console.warn(`An extension pack with id "${pack.info.id}" is already loaded.`);
        return false;
    }
    loadedPacks[pack.info.id] = pack;
    pack.functions.forEach(func => {
        // MODIFIED: The key is now "namespace.function"
        const namespacedName = `${pack.info.id}.${func.name}`;
        console.log(`Registering extension function: ${namespacedName}`);
        extensionRegistry[namespacedName] = {
            inputs: func.inputs || [],
            jsBody: func.javascript,
            packId: pack.info.id // Changed from packName
        };
    });
    return true;
}

function saveCustomExtensions() {
    localStorage.setItem(STORAGE_KEYS.customExtensions, JSON.stringify(customExtensions));
}

// These helper functions will be globally available for the transpiled code to use.
window._extensionExists = (name) => extensionRegistry.hasOwnProperty(name);
window._callExtension = (name, args) => {
    const funcData = extensionRegistry[name];
    if (!funcData) {
        throw new Error(`Extension function "${name}" is not loaded.`);
    }
    if (args.length !== funcData.inputs.length) {
        throw new Error(`Incorrect number of arguments for ${name}. Expected ${funcData.inputs.length}, got ${args.length}.`);
    }
    // Use the Function constructor for safer execution than eval.
    // We dynamically create a function with the specified inputs and JS body.
    const func = new Function(...funcData.inputs, funcData.jsBody);
    return func(...args); // Call it with the provided arguments.
};

function _handleRuntimeError(error, lineNumber) {
    const output = document.getElementById('output');
    output.style.color = '#ff5555'; // Red for errors
    // Format a user-friendly error message!
    output.textContent = `Runtime Error on line ${lineNumber}:\n${error.name}: ${error.message}`;
}

function _print(...args) {
    document.getElementById('output').textContent += args.join(' ');
}
function _println(...args) {
    document.getElementById('output').textContent += args.join(' ') + '\n';
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const editorEl = document.getElementById('code-editor');
    const projectNameText = document.getElementById('project-name-text');
    const projectNameInput = document.getElementById('project-name-input');
    const runBtn = document.getElementById('run-btn');
    const clearBtn = document.getElementById('clear-btn');
    const output = document.getElementById('output');
    const statusBar = document.getElementById('status-bar');

    // --- Autocomplete Keyword List ---
    const novaScriptKeywords = "fun if else for while return True False print println";
    const keywords = new Set(novaScriptKeywords.split(" "));

    // --- CodeMirror Editor Initialization ---
    const editor = CodeMirror(document.getElementById('code-editor'), {
        lineNumbers: true,
        mode: 'python', // Python mode is a good base
        theme: 'material-darker',
        indentUnit: 2,
        tabSize: 2,
        autoCloseBrackets: true, // Addon: Automatically close brackets and quotes
        extraKeys: {
            "Ctrl-Space": "autocomplete" // Addon: Trigger autocomplete with Ctrl+Space
        }
    });

    const defaultCode = ``;
    editor.setValue(defaultCode.trim());

    loadInitialData();
    console.log("Default extensions loaded.");

    // Load saved code or set default
    const savedCode = localStorage.getItem(STORAGE_KEYS.code);
    editor.setValue(savedCode || `// Welcome to NovaScript!\n// Your code and added extensions are saved automatically.\n\nx = random(1, 10)\nprintln("Random number: <x>")`);

    // TODO: update to use custom popup for new code in URL
    const params = new URLSearchParams(window.location.search);
    if (params.has("code")) {
        const newCode = atob(params.get("code"));
        const confirmReplace = confirm(
            "New code found in URL. Replace current code?"
        );
        if (confirmReplace) {
            editor.setValue(newCode);
            localStorage.setItem(STORAGE_KEYS.code, newCode);
            isDirty = false;
        }
        // Remove code from the URL
        params.delete("code");
        history.replaceState({}, "", `${location.pathname}?${params.toString()}`);
    }

    // Load saved project name or set default
    const savedProjectName = localStorage.getItem(STORAGE_KEYS.projectName);
    projectNameText.textContent = savedProjectName || 'Untitled Project';
    projectNameInput.value = savedProjectName || 'Untitled Project';
    isDirty = false; // Start with a clean slate

    // --- Core Functionality & Event Listeners ---
    // Save code on any change
    editor.on('change', () => {
        isDirty = true; // Mark editor as dirty on any change
        localStorage.setItem(STORAGE_KEYS.code, editor.getValue());
    });


    runBtn.addEventListener('click', () => {
        output.textContent = '';
        output.style.color = '';

        const userCode = editor.getValue();

        try {
            const ast = parse(userCode);
            const jsCode = transpile(ast);

            console.log("--- Generated JavaScript ---");
            console.log(jsCode);

            eval(jsCode);

        } catch (e) {
            if (output.textContent === '') {
                output.style.color = '#ff5555';
                output.textContent = e.stack;
            }
            console.error(e);
        }
    });

    clearBtn.addEventListener('click', () => {
        output.textContent = '';
        output.style.color = '';
    });

    // --- UI Enhancement Logic ---

    // --- NEW: Settings Modal Logic ---
    const settingsModal = document.getElementById('settings-modal');
    document.getElementById('settings-btn').addEventListener('click', () => {
        settingsModal.classList.add('show');
    });
    document.getElementById('close-settings-btn').addEventListener('click', () => {
        settingsModal.classList.remove('show');
    });

    // Also, update the main window click listener to close this new modal too
    window.addEventListener('click', (event) => {
        if (event.target === extensionModal) extensionModal.classList.remove('show');
        if (event.target === aboutModal) aboutModal.classList.remove('show');
        if (event.target === settingsModal) settingsModal.classList.remove('show'); // Add this line
    });



    document.getElementById('undo-btn').addEventListener('click', () => editor.undo());
    document.getElementById('redo-btn').addEventListener('click', () => editor.redo());

    // 1. Status Bar
    function updateStatusBar() {
        const cursor = editor.getCursor();
        statusBar.textContent = `Ln ${cursor.line + 1}, Col ${cursor.ch + 1}`;
    }
    editor.on('cursorActivity', updateStatusBar);
    updateStatusBar(); // Initial update

    // 2. Resizable Panels
    const resizer = document.getElementById('resizer');
    const editorContainer = document.querySelector('.editor-container');

    let isResizing = false;
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize'; // Change cursor for the whole page
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        if (!isResizing) return;
        const editorLeft = editorContainer.getBoundingClientRect().left;
        const newWidth = e.clientX - editorLeft;
        // Set a min width to prevent panels from disappearing
        if (newWidth > 100) {
            editorContainer.style.width = `${newWidth}px`;
        }
    }

    function onMouseUp() {
        isResizing = false;
        document.body.style.cursor = 'default'; // Reset cursor
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    // 3. Dropdown Menus
    function setupDropdown(buttonId, dropdownId) {
        const button = document.getElementById(buttonId);
        const dropdown = document.getElementById(dropdownId);
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            // Close other dropdowns
            document.querySelectorAll('.dropdown-content').forEach(d => {
                if (d.id !== dropdownId) d.classList.remove('show');
            });
            dropdown.classList.toggle('show');
        });
    }
    setupDropdown('file-btn', 'file-dropdown');
    setupDropdown('edit-btn', 'edit-dropdown');
    setupDropdown('help-btn', 'help-dropdown');

    // Close dropdowns if user clicks outside
    window.addEventListener('click', (event) => {
        if (!event.target.matches('.dropdown button')) {
            document.querySelectorAll('.dropdown-content').forEach(d => {
                d.classList.remove('show');
            });
        }
    });

    document.getElementById('project-menu').addEventListener('click', () => {
        projectNameText.style.display = 'none';
        projectNameInput.style.display = 'inline-block';
        projectNameInput.focus();
        projectNameInput.select();
    });

    function updateProjectName() {
        const newName = projectNameInput.value.trim();
        if (newName) {
            projectNameText.textContent = newName;
            localStorage.setItem(STORAGE_KEYS.projectName, newName);
        }
        projectNameInput.style.display = 'none';
        projectNameText.style.display = 'inline-block';
    }
    projectNameInput.addEventListener('blur', updateProjectName);
    projectNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') updateProjectName();
        if (e.key === 'Escape') {
            projectNameInput.value = projectNameText.textContent; // Revert changes
            updateProjectName();
        }
    });

    const promptToSaveIfDirty = () => {
        return new Promise((resolve) => {
            if (!isDirty) {
                resolve('dont_save'); // Nothing to save, proceed immediately.
                return;
            }

            const modal = document.getElementById('confirm-modal');
            document.getElementById('confirm-project-name').textContent = projectNameText.textContent;

            // Use .cloneNode(true) to remove any old event listeners
            const saveBtn = document.getElementById('confirm-save-btn').cloneNode(true);
            const dontSaveBtn = document.getElementById('confirm-dont-save-btn').cloneNode(true);
            const cancelBtn = document.getElementById('confirm-cancel-btn').cloneNode(true);

            document.getElementById('confirm-save-btn').replaceWith(saveBtn);
            document.getElementById('confirm-dont-save-btn').replaceWith(dontSaveBtn);
            document.getElementById('confirm-cancel-btn').replaceWith(cancelBtn);

            const hideModal = () => modal.classList.remove('show');

            saveBtn.addEventListener('click', () => { hideModal(); resolve('save'); });
            dontSaveBtn.addEventListener('click', () => { hideModal(); resolve('dont_save'); });
            cancelBtn.addEventListener('click', () => { hideModal(); resolve('cancel'); });

            modal.classList.add('show');
        });
    };

    const handleNewFile = async () => {
        const userChoice = await promptToSaveIfDirty();
        if (userChoice === 'save') await handleSaveFile();
        if (userChoice === 'cancel') return; // Abort

        editor.setValue('');
        projectNameText.textContent = 'Untitled Project';
        projectNameInput.value = 'Untitled Project';
        localStorage.setItem(STORAGE_KEYS.projectName, 'Untitled Project');
        currentFileHandle = null;
        isDirty = false;
    };

    const handleOpenFile = async () => {
        const userChoice = await promptToSaveIfDirty();
        if (userChoice === 'save') await handleSaveFile();
        if (userChoice === 'cancel') return;

        // Modern API for Chrome/Edge
        if (window.showOpenFilePicker) {
            try {
                [currentFileHandle] = await window.showOpenFilePicker({
                    types: [{ description: 'NovaScript Files', accept: { 'text/plain': ['.ns'] } }]
                });
                const file = await currentFileHandle.getFile();
                const content = await file.text();
                updateEditorAfterOpen(file.name, content);
            } catch (err) {
                console.log("Open file dialog cancelled or failed.", err);
            }
        } else {
            // Fallback for Firefox/other browsers
            const fileOpener = document.getElementById('file-opener-fallback');
            fileOpener.click();
            fileOpener.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    updateEditorAfterOpen(file.name, event.target.result);
                };
                reader.readAsText(file);
                currentFileHandle = null; // We don't get a handle with the fallback
                e.target.value = ''; // Reset input so the same file can be opened again
            };
        }
    };

    const handleSaveFile = async () => {
        // If we have a handle (from modern API), save to it directly. Otherwise, trigger "Save As".
        if (currentFileHandle) {
            try {
                const writable = await currentFileHandle.createWritable();
                await writable.write(editor.getValue());
                await writable.close();
                isDirty = false;
                console.log("File saved successfully!");
            } catch (err) {
                console.error("Error saving file:", err);
                // If handle becomes invalid, fall back to "Save As"
                currentFileHandle = null;
                await handleSaveAsFile();
            }
        } else {
            await handleSaveAsFile();
        }
    };

    const handleSaveAsFile = async () => {
        // Modern API for Chrome/Edge
        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: `${projectNameText.textContent}.ns`,
                    types: [{ description: 'NovaScript Files', accept: { 'text/plain': ['.ns'] } }]
                });
                currentFileHandle = handle; // Store the new handle
                await handleSaveFile(); // Call the regular save function
            } catch (err) {
                console.log("Save As dialog cancelled or failed.", err);
            }
        } else {
            // Fallback for Firefox/other browsers
            const content = editor.getValue();
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectNameText.textContent}.ns`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            isDirty = false; // Mark as "saved" after download starts
        }
    };

// NEW: Helper function to avoid duplicating code in handleOpenFile
    function updateEditorAfterOpen(fileName, content) {
        const newProjectName = fileName.replace(/\.ns$/, '');
        editor.setValue(content);
        projectNameText.textContent = newProjectName;
        projectNameInput.value = newProjectName;
        localStorage.setItem(STORAGE_KEYS.projectName, newProjectName);
        isDirty = false;
    }
    document.getElementById('export-url-btn').addEventListener('click', () => {
        const editorCode = editor.getValue();
        const encoded = btoa(editorCode);
        const shareUrl = `${location.origin}${location.pathname}?code=${encoded}`;

        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert("Share link copied to clipboard!");
        });
    });

    document.getElementById('new-file-btn').addEventListener('click', handleNewFile);
    document.getElementById('open-file-btn').addEventListener('click', handleOpenFile);
    document.getElementById('save-file-btn').addEventListener('click', handleSaveFile);
    document.getElementById('save-as-file-btn').addEventListener('click', handleSaveAsFile);

    const aboutModal = document.getElementById('about-modal');
    document.getElementById('about-btn').addEventListener('click', (e) => {
        e.preventDefault();
        aboutModal.classList.add('show');
    });
    document.getElementById('close-about-btn').addEventListener('click', () => {
        aboutModal.classList.remove('show');
    });

    // 2. Extension Modal
    const extensionModal = document.getElementById('extension-modal');
    const extensionSidebar = document.getElementById('extension-sidebar');
    const detailsView = document.getElementById('extension-details-view');
    const addView = document.getElementById('add-extension-view');

    document.getElementById('extensions-btn').addEventListener('click', () => {
        renderExtensionSidebar();
        // Show the "Add Extension" view by default when opening
        showAddExtensionView();
        extensionModal.classList.add('show');
    });

    document.getElementById('close-modal-btn')?.addEventListener('click', () => { // Fictional close button if you add one
        extensionModal.classList.remove('show');
    });
    window.addEventListener('click', (event) => { // Close modals on overlay click
        if (event.target === extensionModal) extensionModal.classList.remove('show');
        if (event.target === aboutModal) aboutModal.classList.remove('show');
    });

    function renderExtensionSidebar() {
        extensionSidebar.innerHTML = ''; // Clear old content
        // Add the "Add New" button first
        const addItem = document.createElement('div');
        addItem.className = 'sidebar-item';
        addItem.id = 'sidebar-add-new';
        addItem.innerHTML = `<strong>Add Extension</strong><span>Import new functions</span>`;
        addItem.addEventListener('click', showAddExtensionView);
        extensionSidebar.appendChild(addItem);

        // Add each loaded extension pack
        for (const packName in loadedPacks) {
            const pack = loadedPacks[packName];
            const item = document.createElement('div');
            item.className = 'sidebar-item';
            item.dataset.packName = packName; // Use data attribute to identify
            item.innerHTML = `<strong>${pack.info.name}</strong><span>v${pack.info.version}</span>`;
            item.addEventListener('click', () => showExtensionDetailsView(packName));
            extensionSidebar.appendChild(item);
        }
    }

    function showAddExtensionView() {
        detailsView.classList.remove('show');
        addView.classList.add('show');
        setActiveSidebarItem('sidebar-add-new');
    }

    function showExtensionDetailsView(packName) {
        const pack = loadedPacks[packName];
        if (!pack) return;

        // Populate the fields
        document.getElementById('detail-name').textContent = pack.info.name;
        document.getElementById('detail-author').textContent = pack.info.author || 'Unknown';
        document.getElementById('detail-version').textContent = pack.info.version;
        document.getElementById('detail-desc').textContent = pack.info.description;


        const removeBtnContainer = document.getElementById('remove-btn-container');
        removeBtnContainer.innerHTML = ''; // Clear previous button
        if (!pack.isDefault) {
            const removeBtn = document.createElement('button');
            removeBtn.id = 'remove-extension-btn';
            removeBtn.textContent = 'Remove Extension';
            removeBtn.addEventListener('click', () => removeExtension(packName));
            removeBtnContainer.appendChild(removeBtn);
        }

        const funcList = document.getElementById('function-list');
        funcList.innerHTML = '';
        pack.functions.forEach(func => {
            const li = document.createElement('li');
            const inputs = func.inputs.join(', ');
            li.textContent = `${pack.info.id}.${func.name}(${inputs}) -> ${func.returns || 'void'}`;
            funcList.appendChild(li);
        });

        addView.classList.remove('show');
        detailsView.classList.add('show');
        setActiveSidebarItem(packName);
    }

    function setActiveSidebarItem(identifier) {
        document.querySelectorAll('.modal-sidebar .sidebar-item').forEach(item => {
            if (item.dataset.packName === identifier || item.id === identifier) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    document.getElementById('add-extension-btn').addEventListener('click', () => {
        const jsonInput = document.getElementById('extension-json-input');
        const errorDisplay = document.getElementById('extension-error');
        errorDisplay.textContent = '';
        try {
            const pack = JSON.parse(jsonInput.value);
            if (loadExtensionPack(pack)) {
                customExtensions.push(pack); // Add the raw object to our custom list
                saveCustomExtensions(); // Save the whole list to localStorage
                renderExtensionSidebar();
                showExtensionDetailsView(pack.info.name);
                jsonInput.value = '';
            }
        } catch (e) {
            errorDisplay.textContent = e.message;
        }
    });

    function removeExtension(packName) {
        const pack = loadedPacks[packName];
        if (!pack || pack.isDefault) return; // Safety check

        // 1. Remove functions from the registry
        pack.functions.forEach(func => {
            delete extensionRegistry[func.name];
        });

        // 2. Remove the pack from our loaded list
        delete loadedPacks[packName];

        // 3. Find and remove the pack from our custom extensions array
        const packIndex = customExtensions.findIndex(p => p.info.id === packName);
        if (packIndex > -1) {
            customExtensions.splice(packIndex, 1);
        }

        // 4. Re-save the updated custom extensions list
        saveCustomExtensions();

        // 5. Update the UI
        renderExtensionSidebar();
        showAddExtensionView(); // Go back to the default "add" screen
    }

    if (browserExtensionMode) {
        document.getElementById('add-extension-view').style.display = 'none';
        document.getElementById('sidebar-add-new').style.display = 'none';
    }
});