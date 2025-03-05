// Add event listeners to all dropdown buttons
document.querySelectorAll('.dropdown-button').forEach(button => {
    button.addEventListener('click', function () {
        const dropdown = this.parentElement; // Get the parent .dropdown of the button
        dropdown.classList.toggle('open');
    });
});
