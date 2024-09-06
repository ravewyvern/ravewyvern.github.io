// Function to open and close windows
function openWindow(windowId) {
    document.getElementById(windowId).style.display = 'block';
}

function closeWindow(windowId) {
    document.getElementById(windowId).style.display = 'none';
}

// Function to display the current time on the taskbar
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('time').textContent = timeString;
}

// Update time every second
setInterval(updateTime, 1000);

// Toggle the start menu
function toggleStartMenu() {
    const startMenu = document.getElementById("start-menu");
    startMenu.style.display = startMenu.style.display === "block" ? "none" : "block";
}

// Toggle calendar and notifications
function toggleCalendar() {
    const calendar = document.getElementById('calendar');
    const notifications = document.getElementById('notifications');
    calendar.style.display = calendar.style.display === 'block' ? 'none' : 'block';
    notifications.style.display = notifications.style.display === 'block' ? 'none' : 'block';
}

// Handle desktop icons
const desktopIcons = document.getElementById('desktop-icons');
desktopIcons.addEventListener('click', function(e) {
    if (e.target.classList.contains('desktop-icon')) {
        // Open a window or do something with clicked icon
        console.log('Desktop icon clicked!');
    }
});
