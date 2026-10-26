
const form = document.getElementById("registrationForm");
const message = document.getElementById("message");
const membersTable = document.getElementById("membersTable");
const searchInput = document.getElementById("searchInput");
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    themeToggle.setAttribute(
        "aria-label",
        `Switch to ${theme === "dark" ? "light" : "dark"} mode`
    );
}

let savedTheme = null;

try {
    savedTheme = localStorage.getItem("memberRegistrationTheme");
} catch {
    savedTheme = null;
}

const systemPrefersDark = window.matchMedia
    && window.matchMedia("(prefers-color-scheme: dark)").matches;
const initialTheme = savedTheme === "dark" || savedTheme === "light"
    ? savedTheme
    : systemPrefersDark ? "dark" : "light";

applyTheme(initialTheme);

themeToggle.addEventListener("click", function() {
    const nextTheme = document.documentElement.dataset.theme === "dark"
        ? "light"
        : "dark";

    applyTheme(nextTheme);

    try {
        localStorage.setItem("memberRegistrationTheme", nextTheme);
    } catch {}
});

// Load members saved in this browser.
let members = [];

try {
    members = JSON.parse(
        localStorage.getItem("registeredMembers") || "[]"
    );

    if (!Array.isArray(members)) {
        members = [];
    }
} catch (error) {
    members = [];
}

// Display a message to the user.
function showMessage(text, type) {
    message.textContent = text;
    message.className = type;
}

// Save member details in the browser.
function saveMembers() {
    try {
        localStorage.setItem(
            "registeredMembers",
            JSON.stringify(members)
        );
        return true;
    } catch (error) {
        showMessage("Unable to save members in this browser.", "error");
        return false;
    }
}

// Display members in the table.
function displayMembers(searchTerm = "") {
    membersTable.replaceChildren();

    const term = searchTerm.trim().toLowerCase();

    const filteredMembers = members.filter(member =>
        [member.fullName, member.email, member.phone]
            .some(value => value.toLowerCase().includes(term))
    );

    if (filteredMembers.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = members.length === 0
            ? "No members registered yet."
            : "No matching members found.";

        row.appendChild(cell);
        membersTable.appendChild(row);
        return;
    }

    filteredMembers.forEach(member => {
        const row = document.createElement("tr");

        [
            member.fullName,
            member.email,
            member.phone,
            member.gender
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-button";
        deleteButton.type = "button";
        deleteButton.dataset.id = member.id;

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);
        membersTable.appendChild(row);
    });
}

// EVENT 1: Handle form submission.
form.addEventListener("submit", function(event) {
    // Prevent the page from reloading.
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const gender = document.getElementById("gender").value;
    const password = document.getElementById("password").value;
    const confirmPassword =
        document.getElementById("confirmPassword").value;

    message.textContent = "";

    // Validate the name.
    if (fullName.length < 2) {
        showMessage("Please enter a valid full name.", "error");
        return;
    }

    // Validate the email.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        showMessage("Please enter a valid email address.", "error");
        return;
    }

    // Prevent duplicate email registrations.
    const emailExists = members.some(member =>
        member.email.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
        showMessage("This email is already registered.", "error");
        return;
    }

    // Validate a Kenyan mobile number.
    const normalizedPhone = phone.replace(/[\s()-]/g, "");
    const phonePattern = /^(?:\+254|0)(?:7\d{8}|1\d{8})$/;

    if (!phonePattern.test(normalizedPhone)) {
        showMessage(
            "Enter a valid Kenyan phone number, e.g. 0712345678.",
            "error"
        );
        return;
    }

    // Validate the password.
    if (password.length < 8) {
        showMessage(
            "Password must contain at least 8 characters.",
            "error"
        );
        return;
    }

    if (password !== confirmPassword) {
        showMessage("Passwords do not match.", "error");
        return;
    }

    // Create the member record.
    // Never save the password in this demonstration.
    const newMember = {
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        fullName: fullName,
        email: email,
        phone: phone,
        gender: gender
    };

    members.push(newMember);

    // If saving fails, undo the addition.
    if (!saveMembers()) {
        members.pop();
        return;
    }

    displayMembers(searchInput.value);
    form.reset();

    showMessage(
        "Member registered successfully!",
        "success"
    );
});

// EVENT 2: Search as the user types.
searchInput.addEventListener("input", function(event) {
    displayMembers(event.target.value);
});

// EVENT 3: Delete a member using a click event.
membersTable.addEventListener("click", function(event) {
    const button = event.target.closest(".delete-button");

    if (!button) {
        return;
    }

    const memberId = button.dataset.id;
    const member = members.find(item => item.id === memberId);

    if (!member) {
        return;
    }

    if (!confirm(`Delete ${member.fullName} from the list?`)) {
        return;
    }

    const originalMembers = members;

    members = members.filter(item => item.id !== memberId);

    if (!saveMembers()) {
        members = originalMembers;
        return;
    }

    displayMembers(searchInput.value);
    showMessage("Member deleted successfully.", "success");
});

// EVENT 4: Clear status messages when the form resets.
form.addEventListener("reset", function() {
    message.textContent = "";
    message.className = "";
});

// Show saved members when the page opens.
displayMembers();
