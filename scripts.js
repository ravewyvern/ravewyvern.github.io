document.addEventListener('DOMContentLoaded', () => {

    // y r u random person reading my code???? ARE YOU TRYING TO STEAL MY GOVERNMENT SECRETS?

    const fontAwesomeKit = document.createElement('script');
    fontAwesomeKit.src = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/js/all.min.js';
    fontAwesomeKit.crossOrigin = 'anonymous';
    document.head.appendChild(fontAwesomeKit);


    const themeSwitcher = document.getElementById('theme-switcher');
    const themeIcon = themeSwitcher.querySelector('.material-icons-outlined');
    const currentTheme = localStorage.getItem('theme') || 'light';

    document.body.setAttribute('data-theme', currentTheme);
    themeIcon.textContent = currentTheme === 'dark' ? 'light_mode' : 'dark_mode';

    themeSwitcher.addEventListener('click', () => {
        let newTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeIcon.textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
        console.log("ewww who uses light theme unless your changing it to dark mode then good")
    });

    // --- RESPONSIVE NAVBAR ---
    const menuToggle = document.getElementById('menu-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevents click from closing menu immediately
        dropdownMenu.classList.toggle('show');
    });

// Close dropdown if clicked outside
    document.addEventListener('click', (e) => {
        if (!menuToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
});