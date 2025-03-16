function shareInvite() {
    const shareData = {
        title: 'Birthday Invitation',
        text: "You're invited to a birthday!",
        url: window.location.href
    };

    // Copy link to clipboard
    navigator.clipboard.writeText(window.location.href).then(() => {
        // Show the popup
        document.getElementById('popup').style.display = 'block';
        document.getElementById('popup-overlay').style.display = 'block';
    }).catch((err) => {
        console.error('Failed to copy:', err);
    });
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
    document.getElementById('popup-overlay').style.display = 'none';
}

function addToCalendar() {
    document.getElementById('calendar-popup').style.display = 'block';
    document.getElementById('popup-overlay').style.display = 'block';
}

function closeCalendarPopup() {
    document.getElementById('calendar-popup').style.display = 'none';
    document.getElementById('popup-overlay').style.display = 'none';
}