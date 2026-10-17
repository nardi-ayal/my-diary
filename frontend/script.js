// ==================================================
// MY DIARY — PERSONAL DIARY MANAGEMENT SYSTEM
// Frontend connected to Node.js + Express + MySQL
// ==================================================


// ==================================================
// 1. API URL
// ==================================================

const API_URL = "http://localhost:3000/api/entries";


// ==================================================
// 2. GET HTML ELEMENTS
// ==================================================

const homePage = document.getElementById("homePage");
const newEntryPage = document.getElementById("newEntryPage");
const entriesPage = document.getElementById("entriesPage");
const favoritesPage = document.getElementById("favoritesPage");
const categoriesPage = document.getElementById("categoriesPage");
const moodPage = document.getElementById("moodPage");
const calendarPage = document.getElementById("calendarPage");

const diaryForm = document.getElementById("diaryForm");

const entryTitle = document.getElementById("entryTitle");
const entryDate = document.getElementById("entryDate");
const entryCategory = document.getElementById("entryCategory");
const entryContent = document.getElementById("entryContent");
const entryFavorite = document.getElementById("entryFavorite");

const searchInput = document.getElementById("searchInput");

const entriesContainer = document.getElementById("entriesContainer");
const allEntriesContainer = document.getElementById("allEntriesContainer");
const favoritesContainer = document.getElementById("favoritesContainer");
const categoriesContainer = document.getElementById("categoriesContainer");

const moodSummary = document.getElementById("moodSummary");
const moodEntriesContainer = document.getElementById("moodEntriesContainer");

const calendarEntriesContainer = document.getElementById(
    "calendarEntriesContainer"
);

const categoryFilter = document.getElementById("categoryFilter");
const moodFilter = document.getElementById("moodFilter");

const calendarGrid = document.getElementById("calendarGrid");
const calendarMonth = document.getElementById("calendarMonth");

const previousMonthBtn = document.getElementById("previousMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");


// ==================================================
// 3. DIARY DATA
// ==================================================

// Entries are loaded from the MySQL database.
// We no longer use localStorage.

let entries = [];

const categoryIcons = {
    Personal: "💗",
    Education: "📚",
    Work: "💻",
    Health: "🌷",
    Friends: "👭",
    Other: "✨"
};

const moodEmojis = {
    Happy: "😊",
    Loved: "🥰",
    Neutral: "😐",
    Sad: "😔",
    Anxious: "😟"
};


// ==================================================
// 4. NORMALIZE DATABASE ENTRIES
// ==================================================

// MySQL uses "entry_date".
// Our frontend uses "date".
//
// This function converts the database result into
// the format used by the frontend.

function normalizeEntry(row) {
    const rawDate = row.entry_date || row.date;

    let formattedDate = "";

    if (rawDate instanceof Date) {
        const year = rawDate.getFullYear();
        const month = String(rawDate.getMonth() + 1).padStart(2, "0");
        const day = String(rawDate.getDate()).padStart(2, "0");

        formattedDate = `${year}-${month}-${day}`;
    } else {
        formattedDate = String(rawDate || "").slice(0, 10);
    }

    return {
        id: Number(row.id),
        title: row.title,
        date: formattedDate,
        category: row.category,
        mood: row.mood,
        content: row.content,
        favorite: Boolean(Number(row.favorite))
    };
}


// ==================================================
// 5. LOAD ENTRIES FROM MYSQL
// ==================================================

async function loadEntries() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not load diary entries.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("The server returned an unexpected response.");
        }

        entries = data.map(normalizeEntry);

        return true;

    } catch (error) {
        console.error("Error loading diary entries:", error);

        alert(
            "Could not connect to the diary backend. 💗\n\n" +
            "Please check that:\n" +
            "1. XAMPP MySQL is running.\n" +
            "2. Your backend server is running on port 3000.\n" +
            "3. Your database connection is working."
        );

        return false;
    }
}


// ==================================================
// 6. SHOW A PARTICULAR PAGE
// ==================================================

function showPage(pageName) {

    const pages = {
        home: homePage,
        "new-entry": newEntryPage,
        entries: entriesPage,
        favorites: favoritesPage,
        categories: categoriesPage,
        mood: moodPage,
        calendar: calendarPage
    };

    // Hide all pages.

    Object.values(pages).forEach(function (page) {
        if (page) {
            page.classList.add("hidden");
        }
    });

    // Show the selected page.

    if (pages[pageName]) {
        pages[pageName].classList.remove("hidden");
    }

    // Update the active navigation link.

    document.querySelectorAll(".nav-link").forEach(function (link) {
        link.classList.remove("active");

        if (link.dataset.page === pageName) {
            link.classList.add("active");
        }
    });

    // Refresh the selected page.

    if (pageName === "home") {
        renderDashboard();
    }

    if (pageName === "entries") {
        renderAllEntries();
    }

    if (pageName === "favorites") {
        renderFavorites();
    }

    if (pageName === "categories") {
        renderCategories();
    }

    if (pageName === "mood") {
        renderMoodTracker();
    }

    if (pageName === "calendar") {
        renderCalendar();
    }
}


// ==================================================
// 7. SIDEBAR NAVIGATION
// ==================================================

document.querySelectorAll(".nav-link").forEach(function (link) {

    link.addEventListener("click", function (event) {
        event.preventDefault();

        showPage(link.dataset.page);
    });

});


// ==================================================
// 8. OPEN THE NEW ENTRY FORM
// ==================================================

document.getElementById("welcomeWriteBtn").addEventListener(
    "click",
    openNewEntry
);

document.getElementById("emptyWriteBtn").addEventListener(
    "click",
    openNewEntry
);

document.getElementById("viewAllBtn").addEventListener(
    "click",
    function () {
        showPage("entries");
    }
);

document.getElementById("cancelEntryBtn").addEventListener(
    "click",
    function () {
        diaryForm.reset();

        delete diaryForm.dataset.editingId;

        setTodayDate();

        showPage("home");
    }
);


function openNewEntry() {

    diaryForm.reset();

    delete diaryForm.dataset.editingId;

    setTodayDate();

    showPage("new-entry");
}


// ==================================================
// 9. SET TODAY'S DATE
// ==================================================

function setTodayDate() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, "0");

    const day = String(today.getDate()).padStart(2, "0");

    entryDate.value = `${year}-${month}-${day}`;
}


// ==================================================
// 10. CREATE OR UPDATE A DIARY ENTRY
// ==================================================

// One submit handler handles both creating and editing.
// This prevents the duplicate-entry bug in the old code.

diaryForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const selectedMood = document.querySelector(
        'input[name="mood"]:checked'
    );

    if (!selectedMood) {
        alert("Please select your mood before saving. 💗");
        return;
    }

    const title = entryTitle.value.trim();
    const date = entryDate.value;
    const category = entryCategory.value;
    const mood = selectedMood.value;
    const content = entryContent.value.trim();
    const favorite = entryFavorite.checked;

    // Validate required fields.

    if (!title || !date || !category || !mood || !content) {
        alert("Please complete all required fields.");
        return;
    }

    // The backend expects "entry_date", not "date".

    const entryData = {
        title: title,
        entry_date: date,
        category: category,
        mood: mood,
        content: content,
        favorite: favorite
    };

    // If editingId exists, update an existing entry.
    // Otherwise, create a new entry.

    const editingId = diaryForm.dataset.editingId;

    const isEditing = Boolean(editingId);

    const url = isEditing
        ? `${API_URL}/${editingId}`
        : API_URL;

    const method = isEditing ? "PUT" : "POST";

    try {

        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(entryData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Could not save your diary entry."
            );
        }

        // Retrieve the latest entries from MySQL.

        const loaded = await loadEntries();

        if (!loaded) {
            return;
        }

        // Reset the form.

        diaryForm.reset();

        delete diaryForm.dataset.editingId;

        setTodayDate();

        // Refresh the dashboard.

        showPage("home");

        if (isEditing) {
            alert("Your memory has been updated! 💗");
        } else {
            alert("Your beautiful memory has been saved! 💗");
        }

    } catch (error) {

        console.error("Error saving diary entry:", error);

        alert(
            "Could not save your memory.\n\n" +
            error.message +
            "\n\nPlease check that your backend and database are running."
        );
    }

});


// ==================================================
// 11. FORMAT THE DATE
// ==================================================

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}


// ==================================================
// 12. CREATE A DIARY ENTRY CARD
// ==================================================

function createEntryCard(entry) {

    const card = document.createElement("article");

    card.className = "entry-card";

    // Top section.

    const top = document.createElement("div");

    top.className = "entry-top";

    const titleArea = document.createElement("div");

    const date = document.createElement("p");

    date.className = "entry-date";

    date.textContent = formatDate(entry.date);

    const title = document.createElement("h3");

    title.textContent = entry.title;

    titleArea.append(date, title);

    top.appendChild(titleArea);

    // Entry content.

    const content = document.createElement("p");

    content.className = "entry-content";

    content.textContent = entry.content;

    // Category and mood.

    const meta = document.createElement("div");

    meta.className = "entry-meta";

    const category = document.createElement("span");

    category.className = "category-badge";

    category.textContent =
        `${categoryIcons[entry.category] || "✨"} ${entry.category}`;

    const mood = document.createElement("span");

    mood.className = "mood-badge";

    mood.textContent =
        `${moodEmojis[entry.mood] || "💗"} ${entry.mood}`;

    meta.append(category, mood);

    // Action buttons.

    const actions = document.createElement("div");

    actions.className = "entry-actions";

    // Favorite button.

    const favoriteButton = document.createElement("button");

    favoriteButton.type = "button";

    favoriteButton.className = "favorite-btn";

    favoriteButton.textContent = entry.favorite
        ? "★ Favorite"
        : "☆ Add Favorite";

    favoriteButton.addEventListener("click", function () {
        toggleFavorite(entry.id);
    });

    // Edit button.

    const editButton = document.createElement("button");

    editButton.type = "button";

    editButton.textContent = "✎ Edit";

    editButton.addEventListener("click", function () {
        editEntry(entry.id);
    });

    // Delete button.

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";

    deleteButton.textContent = "🗑 Delete";

    deleteButton.addEventListener("click", function () {
        deleteEntry(entry.id);
    });

    actions.append(favoriteButton, editButton, deleteButton);

    card.append(top, content, meta, actions);

    return card;
}


// ==================================================
// 13. DISPLAY ENTRIES IN A CONTAINER
// ==================================================

function displayEntries(container, entryList, emptyMessage) {

    if (!container) {
        return;
    }

    container.replaceChildren();

    if (entryList.length === 0) {

        const emptyState = document.createElement("div");

        emptyState.className = "empty-state";

        const icon = document.createElement("div");

        icon.className = "empty-icon";

        icon.textContent = "📔";

        const heading = document.createElement("h3");

        heading.textContent = emptyMessage;

        const paragraph = document.createElement("p");

        paragraph.textContent =
            "Your memories will appear here when you save them.";

        emptyState.append(icon, heading, paragraph);

        container.appendChild(emptyState);

        return;
    }

    entryList.forEach(function (entry) {
        container.appendChild(createEntryCard(entry));
    });
}


// ==================================================
// 14. UPDATE DASHBOARD STATISTICS
// ==================================================

function updateStatistics() {

    document.getElementById("totalEntries").textContent = entries.length;

    const happyCount = entries.filter(function (entry) {
        return entry.mood === "Happy";
    }).length;

    document.getElementById("happyEntries").textContent = happyCount;

    const favoriteCount = entries.filter(function (entry) {
        return entry.favorite;
    }).length;

    document.getElementById("favoriteEntries").textContent = favoriteCount;

    const today = new Date();

    today.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(today);

    const dayOfWeek = (today.getDay() + 6) % 7;

    startOfWeek.setDate(today.getDate() - dayOfWeek);

    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyCount = entries.filter(function (entry) {

        const entryDateValue = new Date(entry.date + "T00:00:00");

        return entryDateValue >= startOfWeek &&
               entryDateValue <= today;

    }).length;

    document.getElementById("weeklyEntries").textContent = weeklyCount;
}


// ==================================================
// 15. DASHBOARD
// ==================================================

function renderDashboard() {

    updateStatistics();

    const recentEntries = entries.slice(0, 4);

    displayEntries(
        entriesContainer,
        recentEntries,
        "Your story starts here!"
    );
}


// ==================================================
// 16. DISPLAY ALL ENTRIES
// ==================================================

function renderAllEntries() {

    const selectedCategory = categoryFilter.value;

    const selectedMood = moodFilter.value;

    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredEntries = entries.filter(function (entry) {

        const matchesCategory =
            !selectedCategory || entry.category === selectedCategory;

        const matchesMood =
            !selectedMood || entry.mood === selectedMood;

        const matchesSearch =
            entry.title.toLowerCase().includes(searchTerm) ||
            entry.content.toLowerCase().includes(searchTerm) ||
            entry.category.toLowerCase().includes(searchTerm);

        return matchesCategory && matchesMood && matchesSearch;
    });

    displayEntries(
        allEntriesContainer,
        filteredEntries,
        "No matching memories found."
    );
}


// ==================================================
// 17. FAVORITES
// ==================================================

function renderFavorites() {

    const favoriteEntries = entries.filter(function (entry) {
        return entry.favorite;
    });

    displayEntries(
        favoritesContainer,
        favoriteEntries,
        "No favorite memories yet."
    );
}


// ==================================================
// 18. CATEGORIES
// ==================================================

function renderCategories() {

    categoriesContainer.replaceChildren();

    Object.keys(categoryIcons).forEach(function (categoryName) {

        const count = entries.filter(function (entry) {
            return entry.category === categoryName;
        }).length;

        const card = document.createElement("div");

        card.className = "category-card";

        const icon = document.createElement("div");

        icon.className = "category-icon";

        icon.textContent = categoryIcons[categoryName];

        const heading = document.createElement("h3");

        heading.textContent = categoryName;

        const paragraph = document.createElement("p");

        paragraph.textContent =
            `${count} ${count === 1 ? "memory" : "memories"}`;

        card.append(icon, heading, paragraph);

        card.addEventListener("click", function () {

            categoryFilter.value = categoryName;

            showPage("entries");
        });

        categoriesContainer.appendChild(card);
    });
}


// ==================================================
// 19. MOOD TRACKER
// ==================================================

function renderMoodTracker() {

    moodSummary.replaceChildren();

    Object.keys(moodEmojis).forEach(function (moodName) {

        const count = entries.filter(function (entry) {
            return entry.mood === moodName;
        }).length;

        const card = document.createElement("div");

        card.className = "mood-summary-card";

        const emoji = document.createElement("div");

        emoji.className = "mood-emoji";

        emoji.textContent = moodEmojis[moodName];

        const heading = document.createElement("h3");

        heading.textContent = moodName;

        const paragraph = document.createElement("p");

        paragraph.textContent =
            `${count} ${count === 1 ? "entry" : "entries"}`;

        card.append(emoji, heading, paragraph);

        moodSummary.appendChild(card);
    });

    displayEntries(
        moodEntriesContainer,
        entries,
        "Your mood journey starts here."
    );
}


// ==================================================
// 20. SEARCH
// ==================================================

searchInput.addEventListener("input", function () {

    const searchTerm = searchInput.value.trim().toLowerCase();

    // Search by title, content, or category.

    const matchingEntries = entries.filter(function (entry) {

        return entry.title.toLowerCase().includes(searchTerm) ||
               entry.content.toLowerCase().includes(searchTerm) ||
               entry.category.toLowerCase().includes(searchTerm);
    });

    if (searchTerm !== "") {

        // Reset the filters so search results aren't hidden.

        categoryFilter.value = "";
        moodFilter.value = "";

        showPage("entries");

        displayEntries(
            allEntriesContainer,
            matchingEntries,
            "No matching memories found."
        );

    } else {

        renderAllEntries();
    }
});


// ==================================================
// 21. CATEGORY AND MOOD FILTERS
// ==================================================

categoryFilter.addEventListener("change", renderAllEntries);

moodFilter.addEventListener("change", renderAllEntries);


// ==================================================
// 22. ADD OR REMOVE FAVORITE
// ==================================================

async function toggleFavorite(entryId) {

    const entry = entries.find(function (item) {
        return item.id === Number(entryId);
    });

    if (!entry) {
        return;
    }

    const updatedData = {
        title: entry.title,
        entry_date: entry.date,
        category: entry.category,
        mood: entry.mood,
        content: entry.content,
        favorite: !entry.favorite
    };

    try {

        const response = await fetch(`${API_URL}/${entry.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Could not update favorite status."
            );
        }

        await loadEntries();

        refreshCurrentPage();

    } catch (error) {

        console.error("Error updating favorite:", error);

        alert("Could not update favorite status. Please try again.");
    }
}


// ==================================================
// 23. EDIT AN ENTRY
// ==================================================

function editEntry(entryId) {

    const entry = entries.find(function (item) {
        return item.id === Number(entryId);
    });

    if (!entry) {
        return;
    }

    entryTitle.value = entry.title;

    entryDate.value = entry.date;

    entryCategory.value = entry.category;

    entryContent.value = entry.content;

    entryFavorite.checked = entry.favorite;

    // Select the mood saved with this entry.

    const moodRadio = document.querySelector(
        `input[name="mood"][value="${entry.mood}"]`
    );

    if (moodRadio) {
        moodRadio.checked = true;
    }

    // Remember which database entry is being edited.

    diaryForm.dataset.editingId = entry.id;

    showPage("new-entry");
}


// ==================================================
// 24. DELETE AN ENTRY
// ==================================================

async function deleteEntry(entryId) {

    const confirmed = confirm(
        "Are you sure you want to delete this memory?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(`${API_URL}/${entryId}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Could not delete diary entry."
            );
        }

        await loadEntries();

        refreshCurrentPage();

        alert("Your memory has been deleted. 💗");

    } catch (error) {

        console.error("Error deleting diary entry:", error);

        alert(
            "Could not delete this memory.\n\n" +
            error.message
        );
    }
}


// ==================================================
// 25. REFRESH THE CURRENT PAGE
// ==================================================

function refreshCurrentPage() {

    const activeLink = document.querySelector(".nav-link.active");

    const currentPage = activeLink
        ? activeLink.dataset.page
        : "home";

    showPage(currentPage);
}


// ==================================================
// 26. CALENDAR
// ==================================================

let calendarDate = new Date();

let selectedCalendarDate = null;


function renderCalendar() {

    calendarGrid.replaceChildren();

    const year = calendarDate.getFullYear();

    const month = calendarDate.getMonth();

    calendarMonth.textContent = calendarDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
    });

    const dayNames = [
        "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
    ];

    // Display the names of the days.

    dayNames.forEach(function (dayName) {

        const dayLabel = document.createElement("div");

        dayLabel.className = "calendar-day-name";

        dayLabel.textContent = dayName;

        calendarGrid.appendChild(dayLabel);
    });

    const firstDay = new Date(year, month, 1);

    const lastDay = new Date(year, month + 1, 0);

    // Convert Sunday-first numbering to Monday-first numbering.

    const startingOffset = (firstDay.getDay() + 6) % 7;

    // Add empty spaces before the first day.

    for (let i = 0; i < startingOffset; i++) {

        const blank = document.createElement("div");

        blank.className = "calendar-day empty-day";

        calendarGrid.appendChild(blank);
    }

    // Create a button for every day of the month.

    for (let day = 1; day <= lastDay.getDate(); day++) {

        const dateString =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const dayButton = document.createElement("button");

        dayButton.type = "button";

        dayButton.className = "calendar-day";

        dayButton.textContent = day;

        const hasEntry = entries.some(function (entry) {
            return entry.date === dateString;
        });

        if (hasEntry) {
            dayButton.classList.add("has-entry");
        }

        if (selectedCalendarDate === dateString) {
            dayButton.classList.add("selected");
        }

        dayButton.addEventListener("click", function () {

            selectedCalendarDate = dateString;

            renderCalendar();
        });

        calendarGrid.appendChild(dayButton);
    }

    // Display entries for the selected date.

    if (selectedCalendarDate) {

        const selectedEntries = entries.filter(function (entry) {
            return entry.date === selectedCalendarDate;
        });

        displayEntries(
            calendarEntriesContainer,
            selectedEntries,
            "No memories saved on this date."
        );

    } else {

        displayEntries(
            calendarEntriesContainer,
            [],
            "Choose a date to explore your memories."
        );
    }
}


// Previous month button.

previousMonthBtn.addEventListener("click", function () {

    calendarDate.setMonth(calendarDate.getMonth() - 1);

    renderCalendar();
});


// Next month button.

nextMonthBtn.addEventListener("click", function () {

    calendarDate.setMonth(calendarDate.getMonth() + 1);

    renderCalendar();
});


// ==================================================
// 27. INITIALIZE THE APPLICATION
// ==================================================

async function initializeApp() {

    // Set today's date in the form.

    setTodayDate();

    // Load saved entries from the MySQL database.

    const loaded = await loadEntries();

    if (!loaded) {
        return;
    }

    // Display the information after the database responds.

    renderDashboard();

    renderAllEntries();

    renderFavorites();

    renderCategories();

    renderMoodTracker();

    renderCalendar();

    console.log("My Diary frontend initialized successfully! 💗");
}


// Start the application.

initializeApp();