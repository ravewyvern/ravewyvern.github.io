// Add event listeners to all dropdown buttons
document.querySelectorAll('.dropdown-button').forEach(button => {
    button.addEventListener('click', function () {
        const dropdown = this.parentElement; // Get the parent .dropdown of the button
        dropdown.classList.toggle('open');
    });
});

// Add event listeners to all dropdown buttons
document.querySelectorAll('.dropdown-button-courses').forEach(button => {
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

// Open the compose modal
function openCompose() {
    document.getElementById('composeModal').style.display = 'flex';
}
// Close the compose modal
function closeCompose() {
    document.getElementById('composeModal').style.display = 'none';
}
// Default folder tag to inbox
let folderTag = "inbox";

// Call displayEmailList on DOMContentLoaded so that inbox emails load by default
document.addEventListener("DOMContentLoaded", function () {
    // Update the folder dropdown button text to "Inbox" by default
    const folderDropdown = document.querySelector(".dropdown .dropdown-button");
    if (folderDropdown) {
        const arrowHTML = folderDropdown.querySelector(".arrow").outerHTML;
        folderDropdown.innerHTML = "Inbox " + arrowHTML;
    }
    displayEmailList();
});

// Listen for dropdown item clicks to update the folder tag, update the dropdown button text, and display filtered emails
document.querySelectorAll(".dropdown-content a").forEach(link => {
    link.addEventListener("click", function (e) {
        e.preventDefault();
        folderTag = this.textContent.trim().toLowerCase();
        // Update the corresponding dropdown button text (preserving the arrow)
        const dropdown = this.closest(".dropdown");
        const arrowHTML = dropdown.querySelector(".arrow").outerHTML;
        dropdown.querySelector(".dropdown-button").innerHTML = this.textContent.trim() + " " + arrowHTML;
        displayEmailList();
    });
});

// Function to display emails by filtering the JSON emails by tag
function displayEmailList() {
    const emailListContainer = document.getElementById("emailList");
    emailListContainer.innerHTML = ""; // Clear current content

    // Filter the emails array using the tag (ensure tags in your emails match folderTag)
    const filteredEmails = emails.filter(email => email.tag.toLowerCase() === folderTag);

    // Loop through filtered emails and add them to the list
    filteredEmails.forEach(email => {
        const emailItem = document.createElement("div");
        emailItem.className = "email-item";
        emailItem.innerHTML = `
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
        emailItem.addEventListener("click", () => {
            showEmailContent(email);
        });
        emailListContainer.appendChild(emailItem);
    });
}

document.getElementById('composeForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const newEmail = {
        date: new Date().toISOString().split('T')[0], // e.g. "2025-05-01"
        title: document.getElementById('subject').value,
        sender: "egg Doe", // or get the sender from a form input if needed
        className: document.getElementById('course').value, // use the selected course name (e.g. "ENGL 101")
        pfp: "../assets/img_1.png",
        bodyPath: "emailtexts/email" + (emails.length + 1) + ".txt", // dynamically assign a path for the email text
        tag: "sent"
    };

    emails.push(newEmail);
    saveEmails();
    displayEmailList();
    closeCompose();
});