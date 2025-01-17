// ====== SELECT ELEMENTS ======
const body = document.querySelector('body');
const navCustomizeButton = document.querySelector('.nav-customize-button');
const customizeDropdown = document.querySelector('.customize-dropdown');

const hamburgerButton = document.querySelector('.hamburger-button');
const menuIcon = document.querySelector('.menu-icon');
const closeIcon = document.querySelector('.close-icon');
const hamburgerDropdown = document.querySelector('.hamburger-dropdown');

const hamburgerCustomizeButton = document.querySelector('.hamburger-customize-button');
const hamburgerCustomizeDropdown = document.querySelector('.hamburger-customize-dropdown');

// Theme buttons
const darkThemeOptions = document.querySelectorAll('.dark-theme-option');
const lightThemeOptions = document.querySelectorAll('.light-theme-option');
const purpleThemeOptions = document.querySelectorAll('.purple-theme-option');

// ====== TOGGLE CUSTOMIZE DROPDOWN (DESKTOP) ======
navCustomizeButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent click from bubbling to body
    // Close hamburger if open
    hamburgerDropdown.style.display = 'none';
    menuIcon.style.display = 'inline-block';
    closeIcon.style.display = 'none';

    // Toggle customize dropdown
    if (customizeDropdown.style.display === 'flex') {
        customizeDropdown.style.display = 'none';
    } else {
        customizeDropdown.style.display = 'flex';
    }
});

// ====== TOGGLE HAMBURGER DROPDOWN ======
hamburgerButton.addEventListener('click', (e) => {
    e.stopPropagation();
    // Close desktop customize if open
    customizeDropdown.style.display = 'none';

    // Toggle hamburger dropdown
    if (hamburgerDropdown.style.display === 'flex') {
        hamburgerDropdown.style.display = 'none';
        menuIcon.style.display = 'inline-block';
        closeIcon.style.display = 'none';
    } else {
        hamburgerDropdown.style.display = 'flex';
        menuIcon.style.display = 'none';
        closeIcon.style.display = 'inline-block';
    }
});

// ====== HAMBURGER CUSTOMIZE TOGGLE ======
hamburgerCustomizeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    if (hamburgerCustomizeDropdown.style.display === 'flex') {
        hamburgerCustomizeDropdown.style.display = 'none';
    } else {
        hamburgerCustomizeDropdown.style.display = 'flex';
    }
});

// ====== CLOSE ALL DROPDOWNS WHEN CLICKING OUTSIDE ======
document.addEventListener('click', () => {
    customizeDropdown.style.display = 'none';
    hamburgerDropdown.style.display = 'none';
    hamburgerCustomizeDropdown.style.display = 'none';
    menuIcon.style.display = 'inline-block';
    closeIcon.style.display = 'none';
});

// Prevent clicks inside dropdown from closing them
customizeDropdown.addEventListener('click', (e) => e.stopPropagation());
hamburgerDropdown.addEventListener('click', (e) => e.stopPropagation());

// ====== THEME SWITCHING ======
function setTheme(theme) {
    // Remove any existing theme classes from <body>
    body.classList.remove('dark-theme', 'light-theme', 'purple-theme');
    body.classList.add(theme + '-theme');
}

// Dark theme
darkThemeOptions.forEach(btn => {
    btn.addEventListener('click', () => setTheme('dark'));
});
// Light theme
lightThemeOptions.forEach(btn => {
    btn.addEventListener('click', () => setTheme('light'));
});
// Purple theme
purpleThemeOptions.forEach(btn => {
    btn.addEventListener('click', () => setTheme('purple'));
});