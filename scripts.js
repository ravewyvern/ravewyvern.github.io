// Theme switching functionality with localStorage
const themeButton = document.querySelector('.theme-button');
const themeMenu = document.getElementById('themeMenu');
const themeOptions = document.querySelectorAll('.theme-option');

// Save theme to localStorage and apply it
function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// Get saved theme from localStorage or default to dark
const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

// Toggle the theme menu
themeButton.addEventListener('click', () => {
    themeMenu.style.display = themeMenu.style.display === 'block' ? 'none' : 'block';
});

// Change theme when a theme option is clicked
themeOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        const selectedTheme = e.target.getAttribute('data-theme');
        setTheme(selectedTheme);

        // Hide theme menu after selection
        themeMenu.style.display = 'none';
    });
});

// Hamburger menu toggle
const hamburger = document.querySelector('.hamburger');
const hamburgerMenu = document.getElementById('hamburger-menu');

hamburger.addEventListener('click', () => {
    hamburgerMenu.classList.toggle('hidden');
});
