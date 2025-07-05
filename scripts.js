document.addEventListener('DOMContentLoaded', () => {

    // --- CONTENT CONFIGURATION ---
    // Here you can easily update your profiles, social links, and skills.

    const profiles = {
        default: {
            profilePic: 'icons/mypfp.png', // Default Profile Pic
            name: 'Your Name',
            pronouns: 'they/them',
            description: `Hey there this website is still work in progress, you can see stuff here soon!`,
            socials: [
                {name: 'GitHub', url: 'https://github.com', icon: 'fab fa-github'},
                {name: 'LinkedIn', url: 'https://linkedin.com', icon: 'fab fa-linkedin'},
                {name: 'Twitter', url: 'https://twitter.com', icon: 'fab fa-twitter'}
            ]
        },
        secret: {
            profilePic: 'icons/mypfp.png', // Special Profile Pic
            name: 'Katelyn Powers',
            pronouns: 'she/her',
            description: `Hey there Im katelyn im just making this site see some stuff here soon!`,
            socials: [
                {name: 'GitHub', url: 'https://github.com', icon: 'fab fa-github'},
                {name: 'tumblr', url: 'https://linkedin.com', icon: 'fab fa-linkedin'},
                {name: 'bluesky', url: 'https://twitter.com', icon: 'fab fa-twitter'}
            ]
        }
        // You can add more profiles here, like 'work', 'friends', etc.
    };

    const skills = [
        {
            name: 'HTML5',
            icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
            info: 'The standard markup language for creating web pages.'
        },
        {
            name: 'CSS3',
            icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg',
            info: 'The language used for styling and laying out web pages.'
        },
        {
            name: 'JavaScript',
            icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
            info: 'A core technology that enables interactive web pages.'
        },
        {
            name: 'Python',
            icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
            info: 'A versatile high-level language for web and data science.'
        },
        {
            name: 'Figma',
            icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg',
            info: 'A collaborative interface design tool.'
        },
        {
            name: 'Node.js',
            icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
            info: 'A JavaScript runtime for building server-side applications.'
        },
    ];
    // To add more skills, just add a new line above.

    // --- FONT AWESOME FOR SOCIAL ICONS ---
    // Using Font Awesome here because it has great brand icons.
    const fontAwesomeKit = document.createElement('script');
    fontAwesomeKit.src = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/js/all.min.js';
    fontAwesomeKit.crossOrigin = 'anonymous';
    document.head.appendChild(fontAwesomeKit);


    // --- THEME SWITCHER ---
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
    });


    // --- DYNAMIC CONTENT LOADER ---
    function loadProfile(profileName) {
        const profile = profiles[profileName] || profiles.default;

        const aboutContent = document.getElementById('about-content');
        aboutContent.innerHTML = `
    <img src="${profile.profilePic}" alt="Profile Picture" class="profile-pic">
    <div class="profile-name">${profile.name}</div>
    <div class="profile-pronouns">${profile.pronouns}</div>
    <div class="social-links">
        ${profile.socials.map(social => `
            <a href="${social.url}" target="_blank" title="${social.name}">
                <i class="${social.icon}"></i>
                <span>${social.name}</span>
            </a>
        `).join('')}
    </div>
`;

        // Populate Description Window
        const descriptionContent = document.getElementById('description-content');
        descriptionContent.textContent = profile.description;
    }

    // Check for URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const profileParam = urlParams.get('profile');

    if (profileParam && profiles[profileParam]) {
        localStorage.setItem('activeProfile', profileParam);
    }

    // Load profile based on localStorage or default
    const activeProfile = localStorage.getItem('activeProfile') || 'default';
    loadProfile(activeProfile);


// --- RESPONSIVE SKILLS DOCK ---
    const skillsContainer = document.getElementById('skills-container');
    const allSkillsData = [
        // Your skills objects from before are now here
        { name: 'HTML5', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg', info: 'The standard markup language for creating web pages.' },
        { name: 'CSS3', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg', info: 'The language used for styling and laying out web pages.' },
        { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg', info: 'A core technology that enables interactive web pages.' },
        { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg', info: 'A versatile high-level language for web and data science.' },
        { name: 'Figma', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg', info: 'A collaborative interface design tool.' },
        { name: 'Node.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg', info: 'A JavaScript runtime for building server-side applications.' },
    ];

    function createSkillElement(skill) {
        const item = document.createElement('div');
        item.className = 'skill-item';
        item.innerHTML = `
        <img src="${skill.icon}" alt="${skill.name}" class="skill-icon">
        <div class="tooltip">
            <div class="tooltip-title">${skill.name}</div>
            <div class="tooltip-info">${skill.info}</div>
        </div>
    `;
        return item;
    }

    function updateSkillsDock() {
        skillsContainer.innerHTML = ''; // Clear existing icons
        const allSkillElements = allSkillsData.map(createSkillElement);
        const visibleElements = [];
        const hiddenElements = [];

        // Temporarily add all skills to measure them
        allSkillElements.forEach(el => skillsContainer.appendChild(el));
        const containerWidth = skillsContainer.offsetWidth;
        let currentWidth = 0;
        const itemMargin = 15; // from the 'gap' property

        // Create and measure the "more" button
        const moreButton = document.createElement('div');
        moreButton.id = 'skills-more-container';
        moreButton.className = 'skill-item';
        moreButton.innerHTML = `<span class="material-icons-outlined">more_horiz</span><div id="skills-popup"></div>`;
        skillsContainer.appendChild(moreButton);
        const moreButtonWidth = moreButton.offsetWidth + itemMargin;
        skillsContainer.removeChild(moreButton); // Remove it for now

        // Determine which skills fit
        for (const el of allSkillElements) {
            const itemWidth = el.offsetWidth + itemMargin;
            if (currentWidth + itemWidth < containerWidth) {
                visibleElements.push(el);
                currentWidth += itemWidth;
            } else {
                hiddenElements.push(el);
            }
        }

        // If there's no room for the 'more' button with the current visible items, move one back
        while (hiddenElements.length > 0 && currentWidth + moreButtonWidth > containerWidth && visibleElements.length > 0) {
            const lastVisible = visibleElements.pop();
            hiddenElements.unshift(lastVisible); // Add it to the beginning of the hidden list
            currentWidth -= (lastVisible.offsetWidth + itemMargin);
        }

        // Final rendering
        skillsContainer.innerHTML = ''; // Clear for the last time
        visibleElements.forEach(el => skillsContainer.appendChild(el));

        if (hiddenElements.length > 0) {
            skillsContainer.appendChild(moreButton);
            const skillsPopup = moreButton.querySelector('#skills-popup');
            hiddenElements.forEach(el => skillsPopup.appendChild(el));

            moreButton.addEventListener('click', (e) => {
                e.stopPropagation();
                skillsPopup.classList.toggle('show');
            });
        }

        addTooltipListeners(); // Re-add listeners to all new elements
    }

// Initial call and on resize
    updateSkillsDock();
    window.addEventListener('resize', updateSkillsDock);

    function addTooltipListeners() {
        document.querySelectorAll('.skill-item').forEach(item => {
            // Don't add listener to the "more" button container
            if(item.id === 'skills-more-container') return;

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const wasActive = item.classList.contains('show-tooltip');

                // Close all other tooltips
                document.querySelectorAll('.skill-item').forEach(i => i.classList.remove('show-tooltip'));

                // If it wasn't already active, show it
                if (!wasActive) {
                    item.classList.add('show-tooltip');
                }
            });
        });
    }

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

// eh
    const skillsPopup = document.getElementById('skills-popup');

// In the document click listener
    document.addEventListener('click', (e) => {
        // ... existing dropdown menu code
        if (dropdownMenu && !menuToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }

        // ADD THIS: Close skills popup if clicked outside
        const moreContainer = document.getElementById('skills-more-container');
        if (skillsPopup && !moreContainer.contains(e.target) && !skillsPopup.contains(e.target)) {
            skillsPopup.classList.remove('show');
        }

        // ADD THIS: Close tooltips if clicked outside
        document.querySelectorAll('.skill-item.show-tooltip').forEach(item => {
            if (!item.contains(e.target)) {
                item.classList.remove('show-tooltip');
            }
        });
    });
    // the end of EH


// --- TERMINAL ---
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');

    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const command = terminalInput.textContent.trim();
            if (command) {
                // Echo the command you typed
                const promptLine = document.createElement('div');
                promptLine.innerHTML = `<span>&gt;</span> ${command}`;
                terminalOutput.appendChild(promptLine);

                // "Execute" the command (just echo for now)
                const echoLine = document.createElement('div');
                echoLine.textContent = command;
                echoLine.classList.add('echo');
                terminalOutput.appendChild(echoLine);

                terminalInput.textContent = ''; // Clear input
                terminalOutput.scrollTop = terminalOutput.scrollHeight; // Scroll to bottom
            }
        }
    });


// --- DRAGGABLE & RESIZABLE WINDOWS ---
    const windows = document.querySelectorAll('.window');
    let maxZIndex = 10;

    windows.forEach(win => {
        // Inject resizer handles into each window
        const resizersHTML = `
        <div class="resizer top-left"></div> <div class="resizer top-right"></div>
        <div class="resizer bottom-left"></div> <div class="resizer bottom-right"></div>
        <div class="resizer top"></div> <div class="resizer bottom"></div>
        <div class="resizer left"></div> <div class="resizer right"></div>
    `;
        win.insertAdjacentHTML('beforeend', resizersHTML);

        const titleBar = win.querySelector('.title-bar');

        // Bring window to front on any interaction
        win.addEventListener('mousedown', () => {
            maxZIndex++;
            win.style.zIndex = maxZIndex;
        });

        // Dragging logic
        titleBar.addEventListener('mousedown', (e) => {
            e.preventDefault();

            // Make window absolute-positioned on first drag
            if (getComputedStyle(win).position !== 'absolute') {
                win.style.height = `${win.offsetHeight}px`; // ADD THIS LINE
                win.style.width = `${win.offsetWidth}px`; // ADD THIS LINE
                const rect = win.getBoundingClientRect();
                win.style.position = 'absolute';
                win.style.left = `${rect.left}px`;
                win.style.top = `${rect.top}px`;
            }

            let offsetX = e.clientX - win.offsetLeft;
            let offsetY = e.clientY - win.offsetTop;

            function onMouseMove(e) {
                win.style.left = `${e.clientX - offsetX}px`;
                win.style.top = `${e.clientY - offsetY}px`;
            }

            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // Resizing logic
        const resizers = win.querySelectorAll('.resizer');
        resizers.forEach(resizer => {
            resizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Stop drag from firing

                // Make window absolute-positioned on first resize
                if (getComputedStyle(win).position !== 'absolute') {
                    win.style.height = `${win.offsetHeight}px`;
                    win.style.width = `${win.offsetWidth}px`; // ADD THIS LINE
                    const rect = win.getBoundingClientRect();
                    win.style.position = 'absolute';
                    win.style.left = `${rect.left}px`;
                    win.style.top = `${rect.top}px`;
                }

                let startX = e.clientX;
                let startY = e.clientY;
                let startWidth = win.offsetWidth;
                let startHeight = win.offsetHeight;
                let startLeft = win.offsetLeft;
                let startTop = win.offsetTop;

                function onMouseMoveResize(e) {
                    const dx = e.clientX - startX;
                    const dy = e.clientY - startY;

                    if (resizer.classList.contains('bottom-right')) {
                        win.style.width = `${startWidth + dx}px`;
                        win.style.height = `${startHeight + dy}px`;
                    } else if (resizer.classList.contains('bottom-left')) {
                        win.style.width = `${startWidth - dx}px`;
                        win.style.height = `${startHeight + dy}px`;
                        win.style.left = `${startLeft + dx}px`;
                    } else if (resizer.classList.contains('top-right')) {
                        win.style.width = `${startWidth + dx}px`;
                        win.style.height = `${startHeight - dy}px`;
                        win.style.top = `${startTop + dy}px`;
                    } else if (resizer.classList.contains('top-left')) {
                        win.style.width = `${startWidth - dx}px`;
                        win.style.height = `${startHeight - dy}px`;
                        win.style.top = `${startTop + dy}px`;
                        win.style.left = `${startLeft + dx}px`;
                    } else if (resizer.classList.contains('top')) {
                        win.style.height = `${startHeight - dy}px`;
                        win.style.top = `${startTop + dy}px`;
                    } else if (resizer.classList.contains('bottom')) {
                        win.style.height = `${startHeight + dy}px`;
                    } else if (resizer.classList.contains('left')) {
                        win.style.width = `${startWidth - dx}px`;
                        win.style.left = `${startLeft + dx}px`;
                    } else if (resizer.classList.contains('right')) {
                        win.style.width = `${startWidth + dx}px`;
                    }
                }

                function onMouseUpResize() {
                    document.removeEventListener('mousemove', onMouseMoveResize);
                    document.removeEventListener('mouseup', onMouseUpResize);
                }

                document.addEventListener('mousemove', onMouseMoveResize);
                document.addEventListener('mouseup', onMouseUpResize);
            });
        });
    });
});