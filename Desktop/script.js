function openWindow(windowId) {
    document.getElementById(windowId).style.display = 'block';
}

function closeWindow(windowId) {
    document.getElementById(windowId).style.display = 'none';
}

// Function to display the current time on the taskbar
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('time').textContent = timeString;
}

// Update time every second
setInterval(updateTime, 1000);
