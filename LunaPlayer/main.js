document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const container = document.getElementById('container');
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleBtn');
    const profileIcon = document.getElementById('profileIcon');
    const profilePopup = document.getElementById('profilePopup');
    const saveBackendUrlBtn = document.getElementById('saveBackendUrl');
    const backendUrlInput = document.getElementById('backendUrl');
    const searchInput = document.getElementById('searchInput');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const miniPlayerTrigger = document.getElementById('miniPlayerTrigger');
    const themeStyle = document.getElementById('theme-style');

    // --- State ---
    let isPlaying = false;

    // --- Functions ---

    /**
     * Switches the main panel to show the specified page.
     * @param {string} pageId The ID of the page-content element to show.
     */
    function showMainPage(pageId) {
        document.querySelectorAll('.page-content.active').forEach(p => p.classList.remove('active'));
        const newPage = document.getElementById(pageId);
        if (newPage) {
            newPage.classList.add('active');
        }
    }

    /**
     * Applies a theme by changing the stylesheet and saving the choice.
     * @param {string} themePath Path to the theme's CSS file.
     */
    function applyTheme(themePath) {
        // Make sure we're actually changing the href attribute
        if (themeStyle.getAttribute('href') !== themePath) {
            themeStyle.setAttribute('href', themePath);
            localStorage.setItem('selectedTheme', themePath);

            // Force a refresh of the stylesheet
            themeStyle.disabled = true;
            setTimeout(() => {
                themeStyle.disabled = false;
            }, 10);

            // Update selection visual
            document.querySelectorAll('.theme-choice').forEach(choice => {
                choice.classList.toggle('selected', choice.dataset.theme === themePath);
            });
        }
    }

    // --- Initial Setup ---

    // Load and apply saved theme on startup
    const savedTheme = localStorage.getItem('selectedTheme') || 'themes/dark_purple.css';
    applyTheme(savedTheme);

    // Load saved backend URL on startup
    backendUrlInput.value = localStorage.getItem('backendUrl') || '';

    // --- Event Listeners ---

    // 1. Sidebar Toggle (FIXED)
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        container.classList.toggle('sidebar-collapsed');
    });

    // 2. Profile Popup
    profileIcon.addEventListener('click', (event) => {
        event.stopPropagation();
        profilePopup.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        if (profilePopup.classList.contains('show')) {
            profilePopup.classList.remove('show');
        }
    });

    profilePopup.addEventListener('click', event => event.stopPropagation());

    // 3. Backend URL Storage
    saveBackendUrlBtn.addEventListener('click', () => {
        const url = backendUrlInput.value.trim();
        if (url) {
            localStorage.setItem('backendUrl', url);
            alert(`Backend URL saved: ${url}`);
            profilePopup.classList.remove('show');
        } else {
            alert('Please enter a valid URL.');
        }
    });

    // 4. Main Page Navigation (Sidebar and Profile)
    document.querySelectorAll('.nav-item, .popup-item[data-page]').forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.getAttribute('data-page');
            if (pageId) {
                showMainPage(pageId);
                // Update active link style only for sidebar items
                if (item.closest('.sidebar-links')) {
                    document.querySelectorAll('.nav-item.active').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                }
                if (profilePopup.classList.contains('show')) {
                    profilePopup.classList.remove('show');
                }
            }
        });
    });

    // 5. Search on Enter (NEW)
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && searchInput.value.trim() !== '') {
            showMainPage('search');
        }
    });

    // 6. Bottom Bar Controls
    playPauseBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        playPauseBtn.textContent = isPlaying ? 'pause_circle' : 'play_arrow';
    });

    // 7. Side Content Panel (Lyrics, Queue, Info)
    const sidePanelTriggers = document.querySelectorAll('.side-panel-trigger');
    sidePanelTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const targetId = trigger.getAttribute('data-target');
            const isActive = trigger.classList.contains('active');

            // Deactivate all triggers and content first
            sidePanelTriggers.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.side-page-content.active').forEach(c => c.classList.remove('active'));

            if (isActive) {
                // If it was active, just close the panel
                container.classList.remove('side-panel-open');
            } else {
                // Otherwise, activate the new one and open the panel
                trigger.classList.add('active');
                document.getElementById(targetId)?.classList.add('active');
                container.classList.add('side-panel-open');
            }
        });
    });

    // 8. Settings Panel Navigation (NEW)
    const settingsNavItems = document.querySelectorAll('.settings-nav-item');
    settingsNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const settingsPageId = item.dataset.settingsPage + '-settings';

            // Update active button
            settingsNavItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Show correct settings page
            document.querySelectorAll('.settings-page').forEach(page => {
                page.classList.toggle('active', page.id === settingsPageId);
            });
        });
    });

    // 9. Theme Switching (NEW)
    document.querySelectorAll('.theme-choice').forEach(choice => {
        choice.addEventListener('click', () => {
            applyTheme(choice.dataset.theme);
        });
    });

    // 10. Mini Player (NEW)
    miniPlayerTrigger.addEventListener('click', () => {
        const albumArtSrc = miniPlayerTrigger.src;
        const miniPlayerHTML = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <title>Mini Player</title>
                <link href="https://fonts.googleapis.com/css2?family=Material+Icons" rel="stylesheet">
                <style>
                    @import "themes/dark_purple.css";
                    body { 
                        margin: 0; 
                        font-family: sans-serif;
                        color: var(--text-color);
                        background-color: var(--background-color);
                        padding: var(--window-gap);

                    }
                    .overlay {
                        width: 100%; height: 100vh;
                        background-color: rgba(0,0,0,0.5);
                        backdrop-filter: blur(10px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 20px;
                        background-image: url('${albumArtSrc}');
                        background-size: cover;
                        background-position: center;
                        border-radius: var(--panel-radius);
                    }
                    .material-icons { 
                        font-size: 48px; 
                        cursor: pointer;
                        text-shadow: 0 0 10px rgba(0,0,0,0.7);
                        transition: transform 0.1s ease;
                    }
                    .material-icons:hover { opacity: 0.8; }
                    .material-icons:active { transform: scale(0.9); }
                </style>
            </head>
            <body>
                <div class="overlay">
                    <i class="material-icons">skip_previous</i>
                    <i class="material-icons">play_arrow</i>
                    <i class="material-icons">skip_next</i>
                </div>
            </body>
            </html>
        `;

        const miniPlayerWindow = window.open('', 'miniPlayer', 'width=350,height=350,resizable=no');
        if (miniPlayerWindow) {
            miniPlayerWindow.document.write(miniPlayerHTML);
            miniPlayerWindow.document.close(); // Important to finalize document writing
        }
    });
});