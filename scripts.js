// Theme switching functionality
const themeButton = document.querySelector('.theme-button');
const themeMenu = document.getElementById('themeMenu');
const themeOptions = document.querySelectorAll('.theme-option');

// Toggle the theme menu
themeButton.addEventListener('click', () => {
    themeMenu.style.display = themeMenu.style.display === 'block' ? 'none' : 'block';
});

// Change theme when a theme option is clicked
themeOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        const selectedTheme = e.target.getAttribute('data-theme');
        document.body.setAttribute('data-theme', selectedTheme);

        // Hide theme menu after selection
        themeMenu.style.display = 'none';
    });
});

document.querySelector('.hamburger').addEventListener('click', function() {
    const menu = document.getElementById('hamburger-menu');
    if (menu.style.display === "flex") {
        menu.style.display = "none";
    } else {
        menu.style.display = "flex";
    }
});

