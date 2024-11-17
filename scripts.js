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
document.addEventListener('DOMContentLoaded', () => {
    fetch('data/skills.json')
        .then(response => response.json())
        .then(data => {
            const skillsContainer = document.querySelector('.skills');
            data.skills.forEach(skill => {
                const skillDiv = document.createElement('div');
                skillDiv.classList.add('skill');

                // Create the skill icon
                const skillIcon = document.createElement('img');
                skillIcon.src = skill.image;  // Corrected to match the 'image' field in the JSON
                skillIcon.alt = skill.name;
                skillIcon.classList.add('skill-icon');

                // Create the tooltip showing skill name and experience
                const tooltip = document.createElement('span');
                tooltip.classList.add('tooltip');
                tooltip.textContent = `${skill.name}: ${skill.experience}`;

                // Append the icon and tooltip to the skillDiv
                skillDiv.appendChild(skillIcon);
                skillDiv.appendChild(tooltip);

                // Append the skillDiv to the skills container
                skillsContainer.appendChild(skillDiv);
            });
        })
        .catch(error => console.error('Error loading skills:', error));
});

document.addEventListener('DOMContentLoaded', function() {
    const postsContainer = document.getElementById('recent-posts');

    // Fetch notifications from the JSON file
    fetch('data/noti.json')
        .then(response => response.json())
        .then(data => {
            // Loop through the data and create notification elements
            data.forEach(post => {
                const li = document.createElement('li');
                li.classList.add('post-item');

                // Create the icon image
                const img = document.createElement('img');
                img.src = post.icon;
                img.alt = `${post.platform} icon`;
                img.classList.add('post-icon');

                // Create the platform name
                const platform = document.createElement('span');
                platform.classList.add('post-platform');
                platform.textContent = post.platform;

                // Create the post title
                const title = document.createElement('span');
                title.classList.add('post-title');
                title.textContent = post.title;

                // Set the link
                li.addEventListener('click', () => {
                    window.open(post.link, '_blank');
                });

                // Append the elements to the list item
                li.appendChild(img);
                li.appendChild(platform);
                li.appendChild(title);

                // Append the list item to the posts container
                postsContainer.appendChild(li);
            });
        })
        .catch(error => console.error('Error fetching notifications:', error));
});





