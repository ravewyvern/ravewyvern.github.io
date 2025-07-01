const PluginManager = {
    registry: {}, // Holds raw plugin definitions and state
    customPlugins: [], // Holds the array of custom plugins for saving
    STORAGE_KEY: 'novaScriptCustomPlugins',

    // --- Initialization ---
    init() {
        this.loadPluginsFromStorage();
        // Enable all plugins that were previously enabled
        for (const pluginId in this.registry) {
            if (this.registry[pluginId].enabled) {
                this.enablePlugin(pluginId);
            }
        }
    },

    // --- Core Plugin Lifecycle ---
    loadPluginsFromStorage() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            this.customPlugins = JSON.parse(saved);
            this.customPlugins.forEach(p => {
                // The 'enabled' state defaults to true for newly added plugins
                const enabled = p.enabled !== false;
                this.registry[p.info.id] = { raw: p, elements: [], enabled: enabled };
            });
        }
    },

    savePluginsToStorage() {
        // We only save the raw definitions and their enabled state
        const dataToSave = Object.values(this.registry).map(p => ({
            ...p.raw,
            enabled: p.enabled
        }));
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
    },

    addPlugin(pluginJson) {
        const plugin = JSON.parse(pluginJson);
        if (!plugin.info || !plugin.info.id) throw new Error("Plugin is missing info.id");
        if (this.registry[plugin.info.id]) throw new Error(`Plugin with ID "${plugin.info.id}" already exists.`);

        this.registry[plugin.info.id] = { raw: plugin, elements: [], enabled: true };
        this.savePluginsToStorage();
        this.enablePlugin(plugin.info.id);
    },

    removePlugin(pluginId) {
        if (this.registry[pluginId].enabled) {
            this.disablePlugin(pluginId);
        }
        delete this.registry[pluginId];
        this.savePluginsToStorage();
    },

    enablePlugin(pluginId) {
        const pluginData = this.registry[pluginId];
        if (!pluginData || pluginData.enabled) return;

        const plugin = pluginData.raw;
        pluginData.enabled = true;

        // Create Sidebar Panels
        plugin.ui?.sidebar?.forEach(panel => {
            // 1. Create the icon in the main icon bar
            const iconEl = document.createElement('span');
            iconEl.id = `plugin-icon-${pluginId}-${panel.id}`;
            iconEl.className = 'material-icons';
            iconEl.textContent = panel.icon;
            iconEl.title = panel.name;
            iconEl.addEventListener('click', () => window.toggleSidebarPanel(`plugin-${pluginId}-${panel.id}`));
            document.querySelector('.icon-sidebar').appendChild(iconEl);
            pluginData.elements.push(iconEl);

            // 2. Create the collapsible panel itself
            const panelEl = document.createElement('div');
            panelEl.id = `plugin-panel-${pluginId}-${panel.id}`;
            panelEl.className = 'sidebar-panel';
            panelEl.innerHTML = `<div class="sidebar-panel-header"><h3>${panel.name}</h3></div><div class="plugin-content"></div>`;
            document.getElementById('collapsible-sidebar').appendChild(panelEl);
            pluginData.elements.push(panelEl);

            // 3. Inject the panel's custom HTML, CSS, and JS
            const contentDiv = panelEl.querySelector('.plugin-content');
            if (panel.html) {
                contentDiv.innerHTML = panel.html;
            }
            if (panel.css) {
                const styleEl = document.createElement('style');
                styleEl.textContent = panel.css;
                panelEl.appendChild(styleEl); // Scope CSS to the panel
            }
            if (panel.js) {
                try {
                    // Safely execute the plugin's JS
                    new Function(panel.js)();
                } catch (e) { console.error(`Error in JS for panel ${panel.id}:`, e); }
            }
        });

        this.savePluginsToStorage();
    },

    disablePlugin(pluginId) {
        const pluginData = this.registry[pluginId];
        if (!pluginData || !pluginData.enabled) return;

        pluginData.elements.forEach(el => el.remove());
        pluginData.elements = [];
        pluginData.enabled = false;
        this.savePluginsToStorage();

        // If the disabled panel was active, close the sidebar
        if (window.activePanel && window.activePanel.startsWith(`plugin-${pluginId}`)) {
            window.toggleSidebarPanel(window.activePanel); // This will close it
        }
    }
};