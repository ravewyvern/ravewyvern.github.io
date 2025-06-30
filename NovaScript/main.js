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
let customThemes = []; // NEW: state for custom themes

// --- NEW: Theme Management ---
const defaultThemes = [
    { name: 'Nova Dark (Default)', isDefault: true, css: `:root { --accent-color: #773ea5; --button-text-color: #ffffff; #773ea5; --accent-color-hover: #5d2d84; --text-color: #ffffff; --secondary-text-color: #888; --darker-text-color: #ccc; --danger-color: #dc3545; --danger-color-hover: #a53131; --discard-color: #676767; --discard-color-hover: #555; --background-color: #1a1a1a; --foreground-color: #212121; --panel-color: #2c2c2c; --menu-hover-color: #3e3e3e; --menu-hover-color-light: #575757; --panel-border-color: #333; --code-block-color: #333; --sidebar-color: #252526; --panel-radius: 20px; --button-radius: 20px; --popup-radius: 20px; --small-radius: 5px; --window-gap: 10px; --inner-gap: 10px; }`},
    {name: 'Nova Light', isDefault: true, css: `:root { --accent-color: #773ea5; --button-text-color: #ffffff; --accent-color-hover: #5d2d84; --text-color: #000000; --secondary-text-color: #555; --darker-text-color: #333; --danger-color: #dc3545; --danger-color-hover: #a53131; --discard-color: #aaa; --discard-color-hover: #888; --background-color: #f4f4f4; --foreground-color: #ffffff; --panel-color: #eaeaea; --menu-hover-color: #dcdcdc; --menu-hover-color-light: #c0c0c0; --panel-border-color: #ccc; --code-block-color: #ddd; --sidebar-color: #f0f0f0; --panel-radius: 20px; --button-radius: 20px; --popup-radius: 20px; --small-radius: 5px; --window-gap: 10px; --inner-gap: 10px; }`},
    {name: 'Nova Black', isDefault: true, css: `:root { --accent-color: #773ea5; --button-text-color: #ffffff; --accent-color-hover: #5d2d84; --text-color: #ffffff; --secondary-text-color: #999; --darker-text-color: #aaa; --danger-color: #dc3545; --danger-color-hover: #a53131; --discard-color: #888; --discard-color-hover: #666; --background-color: #000000; --foreground-color: #0a0a0a; --panel-color: #111111; --menu-hover-color: #1a1a1a; --menu-hover-color-light: #222222; --panel-border-color: #1c1c1c; --code-block-color: #1c1c1c; --sidebar-color: #0d0d0d; --panel-radius: 20px; --button-radius: 20px; --popup-radius: 20px; --small-radius: 5px; --window-gap: 10px; --inner-gap: 10px; }`},
    {name: 'Terminal', isDefault: true, css: `:root { --accent-color: #ffffff; --button-text-color: #000000; --accent-color-hover: #cccccc; --text-color: #ffffff; --secondary-text-color: #ffffff; --darker-text-color: #ffffff; --danger-color: #ff5555; --danger-color-hover: #cc4444; --discard-color: #999999; --discard-color-hover: #777777; --background-color: #000000; --foreground-color: #000000; --panel-color: #000000; --menu-hover-color: #222222; --menu-hover-color-light: #333333; --panel-border-color: #444444; --code-block-color: #111111; --sidebar-color: #000000; --panel-radius: 0px; --button-radius: 0px; --popup-radius: 0px; --small-radius: 0px; --window-gap: 0px; --inner-gap: 0px; }`}
];
const themeStyleTag = document.createElement('style');
themeStyleTag.id = 'dynamic-theme-style';
document.head.appendChild(themeStyleTag);

function applyTheme(themeName, css) {
    // Applying an empty string reverts to the default styles in the main CSS file
    themeStyleTag.textContent = css || '';
    localStorage.setItem('novaScriptActiveTheme', themeName);
}
function saveCustomThemes() {
    localStorage.setItem('novaScriptCustomThemes', JSON.stringify(customThemes));
}
function loadCustomThemes() {
    const saved = localStorage.getItem('novaScriptCustomThemes');
    if (saved) {
        customThemes = JSON.parse(saved);
    }
}

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

document.addEventListener('DOMContentLoaded', async () => { // added async may need to remove idk
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
    loadCustomThemes();
    await loadInitialData();
    console.log("Default extensions loaded.");

    const savedThemeName = localStorage.getItem('novaScriptActiveTheme');
    if (savedThemeName) {
        const allThemes = [...defaultThemes, ...customThemes];
        const themeToApply = allThemes.find(t => t.name === savedThemeName);
        if (themeToApply) {
            applyTheme(themeToApply.name, themeToApply.css);
        }
    }

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
    setupDropdown('addon-btn', 'addon-dropdown');
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
    const libraryModal = document.getElementById('library-modal');
    const pluginModal = document.getElementById('plugin-modal');
    const themeModal = document.getElementById('theme-modal');

    document.getElementById('library-btn').addEventListener('click', () => libraryModal.classList.add('show'));
    document.getElementById('plugin-btn').addEventListener('click', () => pluginModal.classList.add('show'));

    // Add close buttons for these modals
    libraryModal.querySelector('.close-btn').addEventListener('click', () => libraryModal.classList.remove('show'));
    pluginModal.querySelector('.close-btn').addEventListener('click', () => pluginModal.classList.remove('show'));

    // --- NEW: Full Theme Modal Logic ---
    const themeSidebar = document.getElementById('theme-sidebar');
    const themeDetailsView = document.getElementById('theme-details-view');
    const addThemeView = document.getElementById('add-theme-view');

    document.getElementById('theme-btn').addEventListener('click', () => {
        renderThemeSidebar();
        showThemeDetailsView('Nova Dark (Default)'); // Show default theme first
        themeModal.classList.add('show');
    });

    const renderThemeSidebar = () => {
        themeSidebar.innerHTML = '';
        const addItem = document.createElement('div');
        addItem.className = 'sidebar-item';
        addItem.id = 'sidebar-add-theme';
        addItem.innerHTML = `<strong>Add New Theme</strong>`;
        addItem.addEventListener('click', showAddThemeView);
        themeSidebar.appendChild(addItem);

        [...defaultThemes, ...customThemes].forEach(theme => {
            const item = document.createElement('div');
            item.className = 'sidebar-item';
            item.dataset.themeName = theme.name;
            item.innerHTML = `<strong>${theme.name}</strong>`;
            item.addEventListener('click', () => showThemeDetailsView(theme.name));
            themeSidebar.appendChild(item);
        });
    };

    const showAddThemeView = () => {
        themeDetailsView.style.display = 'none';
        addThemeView.style.display = 'block';
        setActiveThemeSidebarItem('sidebar-add-theme');
    };

    const showThemeDetailsView = (themeName) => {
        const allThemes = [...defaultThemes, ...customThemes];
        const theme = allThemes.find(t => t.name === themeName);
        if (!theme) return;

        document.getElementById('theme-detail-name').textContent = theme.name;

        // Update the preview
        const previewFrame = document.getElementById('theme-preview-iframe');
        const previewHTML = `
<style>
    ${theme.css}
body {margin: 0;background-color: var(--background-color);display: flex;flex-direction: column;height: 100vh;overflow: hidden;}
.top-bar {display: flex;align-items: center;padding: 0 12px;height: 40px;background-color: var(--panel-color);border-bottom: 1px solid var(--panel-border-color);flex-shrink: 0;margin: var(--window-gap) var(--window-gap) 0 var(--window-gap);border-radius: var(--panel-radius);}
.logo { width: 24px; margin-right: 8px; }
.dropdown-content a:hover { background-color: var(--menu-hover-color); }
.controls { margin-left: auto; }
button {border: none;padding: 6px 12px;margin-left: 8px;font-size: 0.8rem;display: inline-flex;align-items: center;border-radius: var(--button-radius);}
.main-content {display: flex;flex: 1;height: calc(200vh - 40px - 20px);}
.output-container {display: flex;flex-direction: column;flex: 1;padding: 8px;}
.output {background-color: var(--foreground-color);border-radius: var(--small-radius);border: 1px solid #333;padding: 0.6rem;white-space: pre-wrap;flex: 1;overflow-y: auto;}
.resizer {background-color: var(--panel-color);width: 4px;flex-shrink: 0;border-radius: var(--small-radius);margin-top: var(--inner-gap);margin-bottom: var(--inner-gap);}
.status-bar {height: 20px;background-color: var(--panel-color);border-top: 1px solid #333;display: flex;align-items: center;padding: 0 12px;font-size: 0.72rem;flex-shrink: 0;margin: 0 var(--window-gap) var(--window-gap) var(--window-gap);border-radius: var(--panel-radius);}
.icon-sidebar {width: 40px;background-color: var(--panel-color);overflow-y: auto;flex-shrink: 0;display: flex;flex-direction: column;align-items: center;padding-top: 12px;gap: 16px;border-radius: var(--panel-radius);margin: var(--inner-gap) 0 var(--inner-gap) var(--window-gap);}
.dropdown-example {border: none;padding: 6px 12px;margin-left: 8px;display: inline-flex;align-items: center;width: 16px;border-radius: var(--small-radius);}
</style><div class="top-bar"><img src="icons/novascript-logo.png" alt="Novascript Logo" class="logo">
    <div class="menu-bar"><div class="dropdown-example" style="background: var(--text-color)"></div><div class="dropdown-example" style="background: var(--secondary-text-color)"></div><div class="dropdown-example" style="background: var(--darker-text-color)"></div><div class="dropdown-example" style="background: var(--button-text-color)"></div></div>
    <div class="controls"><button style="color: var(--accent-color); background-color: var(--accent-color);">placehold</button><button style="color: var(--danger-color); background-color: var(--danger-color);">placehold</button><button style="color: var(--discard-color); background-color: var(--discard-color);">placehold</button>
</div></div><div class="main-content"><div class="icon-sidebar"></div><div class="output-container"><pre class="output" style="margin-bottom: 0;margin-top: 0;"></pre></div><div class="resizer" id="resizer"></div><div class="output-container"><pre class="output" style="margin-bottom: 0;margin-top: 0;"></pre></div></div><div class="status-bar"></div>
        `;
        previewFrame.srcdoc = previewHTML;

        // Update action buttons
        const actionsContainer = document.getElementById('theme-actions');
        actionsContainer.innerHTML = ''; // Clear old buttons

        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Apply Theme';
        applyBtn.addEventListener('click', () => applyTheme(theme.name, theme.css));
        actionsContainer.appendChild(applyBtn);

        if (!theme.isDefault) {
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove Theme';
            removeBtn.style.backgroundColor = '#c93c3c';
            removeBtn.addEventListener('click', () => {
                const themeIndex = customThemes.findIndex(t => t.name === theme.name);
                if (themeIndex > -1) {
                    customThemes.splice(themeIndex, 1);
                    saveCustomThemes();
                    renderThemeSidebar();
                    showThemeDetailsView('Nova Dark (Default)'); // Go back to default view
                }
            });
            actionsContainer.appendChild(removeBtn);
        }

        addThemeView.style.display = 'none';
        themeDetailsView.style.display = 'flex';
        setActiveThemeSidebarItem(themeName);
    };

    const setActiveThemeSidebarItem = (themeName) => {
        document.querySelectorAll('#theme-sidebar .sidebar-item').forEach(item => {
            item.classList.toggle('active', item.dataset.themeName === themeName || item.id === themeName);
        });
    };

    document.getElementById('add-theme-btn').addEventListener('click', () => {
        const nameInput = document.getElementById('new-theme-name');
        const cssInput = document.getElementById('theme-css-input');
        const errorDisplay = document.getElementById('theme-error');
        errorDisplay.textContent = '';
        const name = nameInput.value.trim();
        const css = cssInput.value.trim();

        if (!name || !css) {
            errorDisplay.textContent = 'Theme name and CSS content cannot be empty.';
            return;
        }
        if ([...defaultThemes, ...customThemes].some(t => t.name === name)) {
            errorDisplay.textContent = 'A theme with this name already exists.';
            return;
        }

        const newTheme = { name, css, isDefault: false };
        customThemes.push(newTheme);
        saveCustomThemes();
        renderThemeSidebar();
        showThemeDetailsView(name);
        nameInput.value = '';
        cssInput.value = '';
    });

    // Update main window click listener to handle all new modals
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-overlay')) {
            event.target.classList.remove('show');
        }
    });
});