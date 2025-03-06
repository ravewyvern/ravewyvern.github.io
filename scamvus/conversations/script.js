// Add event listeners to all dropdown buttons
document.querySelectorAll('.dropdown-button').forEach(button => {
    button.addEventListener('click', function () {
        const dropdown = this.parentElement; // Get the parent .dropdown of the button
        dropdown.classList.toggle('open');
    });
});



const receiverName = "Ian Hall"; // Example receiver name
let emails = [];

// Fetch JSON data
fetch('emails.json')
    .then(res => res.json())
    .then(data => {
        emails = data;
        loadEmails();
    });

function loadEmails() {
    const list = document.getElementById('emailList');
    list.innerHTML = "";

    emails.forEach((email, index) => {
        const item = document.createElement('div');
        item.className = 'email-item';
        item.innerHTML = `
          <div class="row1">
            <div>
              <input type="checkbox" class="email-checkbox">
              <span class="email-date">${email.date}</span>
            </div>
            <span class="badge">1</span>
          </div>
          <div class="row2">
            <div class="circle-toggle"></div>
            <span>${email.sender}</span>
            <span>${receiverName}</span>
          </div>
          <div class="row3">
            <span class="subject">${email.title}</span>
          </div>
          <div class="row4">
            <span class="preview"></span>
            <div class="star-toggle"></div>
          </div>
        `;

        // Load .txt file for preview
        fetch(email.bodyPath)
            .then(res => res.text())
            .then(text => {
                item.querySelector('.preview').textContent = text.split('\\n')[0] || "";
            });

        // Toggle circle
        item.querySelector('.circle-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            e.target.classList.toggle('filled');
        });

        // Toggle star
        item.querySelector('.star-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            e.target.classList.toggle('filled');
        });

        // Email click
        item.addEventListener('click', () => {
            document.querySelectorAll('.email-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            showEmailContent(email);
        });

        list.appendChild(item);
    });
}

function showEmailContent(email) {
    const contentPanel = document.getElementById('emailContent');
    if (!email) {
        contentPanel.innerHTML = "No email selected.";
        return;
    }
    // Fetch full body from .txt file
    fetch(email.bodyPath)
        .then(res => res.text())
        .then(fullBody => {
            contentPanel.innerHTML = `
            <div class="email-subject">${email.title}</div>
            <div class="divider"></div>
            <div class="email-meta">
              <img class="pfp" src="${email.pfp}" alt="profile">
  <div class="email-meta-text">
    <span>${email.sender}</span>
    <span>${email.className}</span>
    <span>${email.date}</span>
  </div>
            </div>
            <div class="email-body">${fullBody}</div>
          `;
        });
}