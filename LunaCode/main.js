

let _printBuffer = '';

const browserExtensionMode = false;
const STORAGE_KEYS = {
    code: 'novaScriptCode',
    projectName: 'novaScriptProjectName',
    keymap: 'novaScriptKeymap'
};
const defaultKeymap = {
    'runCode': 'Ctrl-Enter',
    'clearOutput': 'Ctrl-K'
};

let currentFileHandle = null;
let isDirty = false;
let customThemes = [];
let keymap = { ...defaultKeymap };

const defaultThemes = [
    {name: 'Dark Night (Default)', isDefault: false, css: `:root { --accent-color: #6e57ff; --accent-color-hover: #4e3dcc; --button-text-color: #ffffff; --text-color: #e0e0ff; --secondary-text-color: #9f9fcf; --darker-text-color: #bcbce0; --danger-color: #ff4d6d; --danger-color-hover: #cc3a53; --discard-color: #666688; --discard-color-hover: #4d4d66; --background-color: #050505; --foreground-color: #0d0d0f; --panel-color: #111118; --menu-hover-color: #1a1a22; --menu-hover-color-light: #2a2a38; --panel-border-color: #222234; --code-block-color: #1a1a2a; --sidebar-color: #0a0a12; --panel-radius: 20px; --button-radius: 20px; --popup-radius: 20px; --small-radius: 5px; --window-gap: 10px; --inner-gap: 10px; }`},
    { name: 'Nova Dark', isDefault: true, css: `:root { --accent-color: #773ea5; --button-text-color: #ffffff; #773ea5; --accent-color-hover: #5d2d84; --text-color: #ffffff; --secondary-text-color: #888; --darker-text-color: #ccc; --danger-color: #dc3545; --danger-color-hover: #a53131; --discard-color: #676767; --discard-color-hover: #555; --background-color: #1a1a1a; --foreground-color: #212121; --panel-color: #2c2c2c; --menu-hover-color: #3e3e3e; --menu-hover-color-light: #575757; --panel-border-color: #333; --code-block-color: #333; --sidebar-color: #252526; --panel-radius: 20px; --button-radius: 20px; --popup-radius: 20px; --small-radius: 5px; --window-gap: 10px; --inner-gap: 10px; }`},
    {name: 'Nova Light', isDefault: true, css: `:root { --accent-color: #773ea5; --button-text-color: #ffffff; --accent-color-hover: #5d2d84; --text-color: #000000; --secondary-text-color: #555; --darker-text-color: #333; --danger-color: #dc3545; --danger-color-hover: #a53131; --discard-color: #aaa; --discard-color-hover: #888; --background-color: #f4f4f4; --foreground-color: #ffffff; --panel-color: #eaeaea; --menu-hover-color: #dcdcdc; --menu-hover-color-light: #c0c0c0; --panel-border-color: #ccc; --code-block-color: #ddd; --sidebar-color: #f0f0f0; --panel-radius: 20px; --button-radius: 20px; --popup-radius: 20px; --small-radius: 5px; --window-gap: 10px; --inner-gap: 10px; }`},
    {name: 'Nova Black', isDefault: true, css: `:root { --accent-color: #773ea5; --button-text-color: #ffffff; --accent-color-hover: #5d2d84; --text-color: #ffffff; --secondary-text-color: #999; --darker-text-color: #aaa; --danger-color: #dc3545; --danger-color-hover: #a53131; --discard-color: #888; --discard-color-hover: #666; --background-color: #000000; --foreground-color: #0a0a0a; --panel-color: #111111; --menu-hover-color: #1a1a1a; --menu-hover-color-light: #222222; --panel-border-color: #1c1c1c; --code-block-color: #1c1c1c; --sidebar-color: #0d0d0d; --panel-radius: 20px; --button-radius: 20px; --popup-radius: 20px; --small-radius: 5px; --window-gap: 10px; --inner-gap: 10px; }`},
    {name: 'Terminal', isDefault: true, css: `:root { --accent-color: #ffffff; --button-text-color: #000000; --accent-color-hover: #cccccc; --text-color: #ffffff; --secondary-text-color: #ffffff; --darker-text-color: #ffffff; --danger-color: #ff5555; --danger-color-hover: #cc4444; --discard-color: #999999; --discard-color-hover: #777777; --background-color: #000000; --foreground-color: #000000; --panel-color: #000000; --menu-hover-color: #222222; --menu-hover-color-light: #333333; --panel-border-color: #444444; --code-block-color: #111111; --sidebar-color: #000000; --panel-radius: 0px; --button-radius: 0px; --popup-radius: 0px; --small-radius: 0px; --window-gap: 0px; --inner-gap: 0px; }`}
];
const themeStyleTag = document.createElement('style');
themeStyleTag.id = 'dynamic-theme-style';
document.head.appendChild(themeStyleTag);

function applyTheme(themeName, css) {
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

document.addEventListener('DOMContentLoaded', async () => { // added async may need to remove idk
    const projectNameText = document.getElementById('project-name-text');
    const projectNameInput = document.getElementById('project-name-input');
    const runBtn = document.getElementById('run-btn');
    const settingsModal = document.getElementById('settings-modal');
    const clearBtn = document.getElementById('clear-btn');

    const defaultCode = ``;
    loadCustomThemes();

    const savedThemeName = localStorage.getItem('novaScriptActiveTheme');
    if (savedThemeName) {
        const allThemes = [...defaultThemes, ...customThemes];
        const themeToApply = allThemes.find(t => t.name === savedThemeName);
        if (themeToApply) {
            applyTheme(themeToApply.name, themeToApply.css);
        }
    }


    const savedCode = localStorage.getItem(STORAGE_KEYS.code);

    const savedProjectName = localStorage.getItem(STORAGE_KEYS.projectName);
    projectNameText.textContent = savedProjectName || 'Untitled Project';
    projectNameInput.value = savedProjectName || 'Untitled Project';
    isDirty = false;

    document.getElementById('settings-btn').addEventListener('click', () => {
        settingsModal.classList.add('show');
    });

    window.addEventListener('click', (event) => {
        if (event.target === aboutModal) aboutModal.classList.remove('show');
        if (event.target === settingsModal) settingsModal.classList.remove('show'); // Add this line
    });

    const resizer = document.getElementById('resizer');

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

    function setupDropdown(buttonId, dropdownId) {
        const button = document.getElementById(buttonId);
        const dropdown = document.getElementById(dropdownId);
        button.addEventListener('click', (event) => {
            event.stopPropagation();
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

    const iconSidebarButtons = {
        files: document.getElementById('sidebar-files-btn'),
        search: document.getElementById('sidebar-search-btn')
    };
    const collapsibleSidebar = document.getElementById('collapsible-sidebar');
    const iconSidebar = document.getElementById('icon-sidebar');
    const sidebarPanels = {
        files: document.getElementById('files-panel'),
        search: document.getElementById('search-panel')
    };

    let activePanel = null;

    const toggleSidebarPanel = (panelName) => {
        if (activePanel === panelName) {
            collapsibleSidebar.style.display = 'none';
            iconSidebar.classList.remove('sidebar-panel-active');
            activePanel = null;
        } else {
            collapsibleSidebar.style.display = 'block';
            iconSidebar.classList.add('sidebar-panel-active');
            activePanel = panelName;
            Object.values(sidebarPanels).forEach(panel => panel.classList.remove('show'));
            sidebarPanels[panelName].classList.add('show');
        }

        Object.keys(iconSidebarButtons).forEach(key => {
            iconSidebarButtons[key].classList.toggle('active', key === activePanel);
        });
    };

    iconSidebarButtons.files.addEventListener('click', () => toggleSidebarPanel('files'));
    iconSidebarButtons.search.addEventListener('click', () => toggleSidebarPanel('search'));

    const aboutModal = document.getElementById('about-modal');
    document.getElementById('about-btn').addEventListener('click', (e) => {
        e.preventDefault();
        aboutModal.classList.add('show');
    });
    document.getElementById('close-about-btn').addEventListener('click', () => {
        aboutModal.classList.remove('show');
    });

    window.addEventListener('click', (event) => {
        if (event.target === aboutModal) aboutModal.classList.remove('show');
    });

    function setActiveSidebarItem(identifier) {
        document.querySelectorAll('.modal-sidebar .sidebar-item').forEach(item => {
            if (item.dataset.packName === identifier || item.id === identifier) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    if (browserExtensionMode) {
        document.getElementById('sidebar-add-new').style.display = 'none';
    }
    const themeModal = document.getElementById('theme-modal');

    document.getElementById('plugin-btn').addEventListener('click', () => pluginModal.classList.add('show'));
    const themeSidebar = document.getElementById('theme-sidebar');
    const themeDetailsView = document.getElementById('theme-details-view');
    const addThemeView = document.getElementById('add-theme-view');

    document.getElementById('theme-btn').addEventListener('click', () => {
        renderThemeSidebar();
        showThemeDetailsView('Dark Night (Default)');
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
</style><div class="top-bar"><img src="icons/LunaCode-logo.png" alt="Novascript Logo" class="logo">
    <div class="menu-bar"><div class="dropdown-example" style="background: var(--text-color)"></div><div class="dropdown-example" style="background: var(--secondary-text-color)"></div><div class="dropdown-example" style="background: var(--darker-text-color)"></div><div class="dropdown-example" style="background: var(--button-text-color)"></div></div>
    <div class="controls"><button style="color: var(--accent-color); background-color: var(--accent-color);">placehold</button><button style="color: var(--danger-color); background-color: var(--danger-color);">placehold</button><button style="color: var(--discard-color); background-color: var(--discard-color);">placehold</button>
</div></div><div class="main-content"><div class="icon-sidebar"></div><div class="output-container"><pre class="output" style="margin-bottom: 0;margin-top: 0;"></pre></div><div class="resizer" id="resizer"></div><div class="output-container"><pre class="output" style="margin-bottom: 0;margin-top: 0;"></pre></div></div><div class="status-bar"></div>
        `;
        previewFrame.srcdoc = previewHTML;

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

        const newTheme = {name, css, isDefault: false};
        customThemes.push(newTheme);
        saveCustomThemes();
        renderThemeSidebar();
        showThemeDetailsView(name);
        nameInput.value = '';
        cssInput.value = '';
    });

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-overlay')) {
            event.target.classList.remove('show');
        }
    });
})