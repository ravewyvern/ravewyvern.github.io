document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const container = document.getElementById('container');
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleBtn');
    const profileIcon = document.getElementById('profileIcon');
    const profilePopup = document.getElementById('profilePopup');
    const saveBackendUrlBtn = document.getElementById('saveBackendUrl');
    const backendUrlInput = document.getElementById('backendUrl');
    const mainPanel = document.getElementById('mainPanel');
    const sideContentPanel = document.getElementById('sideContentPanel');
    const playPauseBtn = document.getElementById('playPauseBtn');

    let isPlaying = false;
    let currentSidePanel = null;

    // --- Sidebar Toggle ---
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        const newSidebarWidth = isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)';
        document.documentElement.style.setProperty('--sidebar-width', newSidebarWidth);
    });

    // --- Profile Popup ---
    profileIcon.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevents click from bubbling up to document
        profilePopup.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        if (profilePopup.classList.contains('show')) {
            profilePopup.classList.remove('show');
        }
    });

    profilePopup.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevents popup from closing when clicking inside
    });

    // --- Backend URL Storage ---
    saveBackendUrlBtn.addEventListener('click', () => {
        const url = backendUrlInput.value.trim();
        if (url) {
            localStorage.setItem('backendUrl', url);
            alert(`Backend URL saved: ${url}`);
        } else {
            alert('Please enter a valid URL.');
        }
        profilePopup.classList.remove('show');
    });

    // Load saved URL on startup
    backendUrlInput.value = localStorage.getItem('backendUrl') || '';

    // --- Page Navigation ---
    const navItems = document.querySelectorAll('.nav-item, .popup-item[data-page]');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.getAttribute('data-page');
            if (pageId) {
                // Switch main content
                document.querySelectorAll('.page-content.active').forEach(p => p.classList.remove('active'));
                document.getElementById(pageId)?.classList.add('active');

                // Update active link style in sidebar
                if(item.closest('.sidebar-links')) {
                    document.querySelectorAll('.nav-item.active').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                }

                // Close popup if the click was from there
                profilePopup.classList.remove('show');
            }
        });
    });

    // --- Bottom Bar Controls ---

    // Play/Pause Button
    playPauseBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        playPauseBtn.textContent = isPlaying ? 'pause_circle' : 'play_arrow';
        if(isPlaying) {
            playPauseBtn.style.fontSize = '44px' // Ensure size consistency
        }
    });

    // Lyrics, Queue, Info Panel Toggling
    const sidePanelTriggers = document.querySelectorAll('.side-panel-trigger');
    sidePanelTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const targetId = trigger.getAttribute('data-target');

            // If clicking the active trigger, close the panel
            if (trigger.classList.contains('active')) {
                container.classList.remove('side-panel-open');
                trigger.classList.remove('active');
                currentSidePanel = null;
                return;
            }

            // Deactivate previous trigger and content
            sidePanelTriggers.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.side-page-content.active').forEach(c => c.classList.remove('active'));

            // Activate new trigger and content
            trigger.classList.add('active');
            document.getElementById(targetId)?.classList.add('active');

            // Open the panel if it's not already open
            if (!container.classList.contains('side-panel-open')) {
                container.classList.add('side-panel-open');
            }
        });
    });
});