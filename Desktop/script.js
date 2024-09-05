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
    if (startMenu.style.display === "block") {
        startMenu.style.display = "none";
    } else {
        startMenu.style.display = "block";
    }
}

// Hide the start menu when clicked outside
document.addEventListener('click', function(event) {
    const startMenu = document.getElementById('start-menu');
    const startButton = document.querySelector('.start-button');

    if (!startMenu.contains(event.target) && !startButton.contains(event.target)) {
        startMenu.style.display = 'none';
    }
});
