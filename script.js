
/* =========================
   CLOCK
========================= */

function updateTime() {
  const timeElement = document.getElementById("timeElement");

  if (timeElement) {
    timeElement.textContent = new Date().toLocaleString();
  }
}

updateTime();
setInterval(updateTime, 1000);


/* =========================
   GET HTML ELEMENTS
========================= */

const welcomeScreen = document.getElementById("welcome");
const notesScreen = document.getElementById("notes");

const welcomeClose = document.getElementById("welcomeclose");
const welcomeOpen = document.getElementById("welcomeopen");
const notesClose = document.getElementById("notesclose");
const notesIcon = document.getElementById("notesIcon");


/* =========================
   WINDOW CONTROLS
========================= */

let highestZIndex = 10;

function bringToFront(element) {
  if (!element) return;

  highestZIndex++;
  element.style.zIndex = highestZIndex;
}

function openWindow(element) {
  if (!element) return;

  element.style.display = "flex";
  bringToFront(element);
}

function closeWindow(element) {
  if (!element) return;

  element.style.display = "none";

  if (element === notesScreen && notesIcon) {
    notesIcon.classList.remove("selected");
  }
}


/* =========================
   WELCOME WINDOW BUTTONS
========================= */

if (welcomeClose) {
  welcomeClose.addEventListener("click", function (event) {
    event.stopPropagation();
    closeWindow(welcomeScreen);
  });
}

if (welcomeOpen) {
  welcomeOpen.addEventListener("click", function () {
    openWindow(welcomeScreen);
  });
}


/* =========================
   NOTEPEDIA ICON
========================= */

if (notesIcon) {
  notesIcon.addEventListener("click", function () {
    if (!notesScreen) return;

    if (notesScreen.style.display === "none") {
      notesIcon.classList.add("selected");
      openWindow(notesScreen);
    } else {
      closeWindow(notesScreen);
    }
  });
}

if (notesClose) {
  notesClose.addEventListener("click", function (event) {
    event.stopPropagation();
    closeWindow(notesScreen);
  });
}


/* =========================
   DRAGGABLE WINDOWS
========================= */

function dragElement(element) {
  if (!element) return;

  const header = document.getElementById(element.id + "header");

  if (!header) {
    console.error("Could not find the drag header for:", element.id);
    return;
  }

  header.style.cursor = "grab";

  header.addEventListener("mousedown", function (event) {
    if (event.button !== 0) return;

    event.preventDefault();

    const rect = element.getBoundingClientRect();

    element.style.transform = "none";
    element.style.position = "fixed";
    element.style.margin = "0";
    element.style.left = rect.left + "px";
    element.style.top = rect.top + "px";

    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = rect.left;
    const startTop = rect.top;

    header.style.cursor = "grabbing";
    bringToFront(element);

    function moveWindow(event) {
      element.style.left =
        startLeft + event.clientX - startX + "px";

      element.style.top =
        startTop + event.clientY - startY + "px";
    }

    function stopDragging() {
      header.style.cursor = "grab";

      document.removeEventListener("mousemove", moveWindow);
      document.removeEventListener("mouseup", stopDragging);
    }

    document.addEventListener("mousemove", moveWindow);
    document.addEventListener("mouseup", stopDragging);
  });
}

dragElement(welcomeScreen);
dragElement(notesScreen);


/* =========================
   DEFAULT NOTES
========================= */

const defaultNotes = [
  {
    id: "welcome",
    title: "Welcome",
    body: "Welcome to Notepedia!\n\nCreate your own notes using the Add Entry button.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "redos-ideas",
    title: "RedOS Ideas",
    body: "Ideas for RedOS:\n\n- Make more desktop apps.\n- Improve the window design.\n- Add useful features.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];


/* =========================
   LOAD AND SAVE NOTES
========================= */

const storageKey = "redOSNotepediaNotesV1";

function loadNotes() {
  try {
    const saved = localStorage.getItem(storageKey);

    if (saved !== null) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        // Support older notes that used "content"
        // instead of "body".
        return parsed.map(function (note) {
          return {
            id: note.id || (
              Date.now().toString() +
              Math.random().toString(16).slice(2)
            ),
            title: note.title || "Untitled note",
            body: note.body ?? note.content ?? "",
            createdAt: note.createdAt || new Date().toISOString(),
            updatedAt: note.updatedAt || note.createdAt ||
              new Date().toISOString()
          };
        });
      }
    }
  } catch (error) {
    console.error("Could not load saved notes:", error);
  }

  return defaultNotes.map(note => ({ ...note }));
}

let content = loadNotes();

function saveNotes() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(content));
    return true;
  } catch (error) {
    console.error("Could not save notes:", error);
    alert("Your notes could not be saved in this browser.");
    return false;
  }
}


/* =========================
   FORMAT DATES
========================= */

function formatDate(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}


/* =========================
   FIND APP AREAS
========================= */

const sidebar = document.getElementById("sidebar");
const noteContentArea = document.getElementById("noteContent");

let selectedNoteId = content.length > 0 ? content[0].id : null;


/* =========================
   CREATE A NEW NOTE
========================= */

function addNote() {
  const now = new Date().toISOString();

  const newNote = {
    id: (
      Date.now().toString() +
      Math.random().toString(16).slice(2)
    ),
    title: "Untitled note",
    body: "",
    createdAt: now,
    updatedAt: now
  };

  content.unshift(newNote);
  selectedNoteId = newNote.id;

  if (saveNotes()) {
    renderSidebar();
    showNote(newNote.id);

    const titleInput = document.getElementById("noteTitleInput");

    if (titleInput) {
      titleInput.focus();
      titleInput.select();
    }
  } else {
    content.shift();
    selectedNoteId = content.length > 0 ? content[0].id : null;
    renderSidebar();
  }
}


/* =========================
   DELETE A NOTE
========================= */

function deleteNote(id) {
  const note = content.find(item => item.id === id);

  if (!note) return;

  const confirmed = confirm(
    `Are you sure you want to delete "${note.title}"?`
  );

  if (!confirmed) return;

  const previousContent = [...content];
  const previousSelectedId = selectedNoteId;

  content = content.filter(item => item.id !== id);

  if (!saveNotes()) {
    // Restore the note if saving fails.
    content = previousContent;
    selectedNoteId = previousSelectedId;
    renderSidebar();
    showNote(id);
    return;
  }

  if (content.length > 0) {
    selectedNoteId = content[0].id;
    renderSidebar();
    showNote(selectedNoteId);
  } else {
    selectedNoteId = null;
    renderSidebar();

    if (noteContentArea) {
      noteContentArea.replaceChildren();

      const message = document.createElement("p");
      message.textContent =
        "No notes yet. Click + Add Entry to create one.";

      noteContentArea.appendChild(message);
    }
  }
}


/* =========================
   DISPLAY A NOTE
========================= */

function showNote(id) {
  const note = content.find(item => item.id === id);

  if (!note || !noteContentArea) return;

  selectedNoteId = id;

  noteContentArea.replaceChildren();

  // Title input
  const titleInput = document.createElement("input");
  titleInput.id = "noteTitleInput";
  titleInput.type = "text";
  titleInput.value = note.title;
  titleInput.placeholder = "Enter a title";

  titleInput.style.width = "100%";
  titleInput.style.boxSizing = "border-box";
  titleInput.style.fontSize = "20px";
  titleInput.style.fontWeight = "bold";
  titleInput.style.padding = "8px";
  titleInput.style.marginBottom = "8px";

  // Creation and update dates
  const dateText = document.createElement("p");
  dateText.style.fontSize = "12px";
  dateText.style.color = "#666";

  function updateDateText() {
    dateText.textContent =
      "Created: " + formatDate(note.createdAt) +
      " | Updated: " + formatDate(note.updatedAt);
  }

  updateDateText();

  // Note body
  const bodyInput = document.createElement("textarea");
  bodyInput.id = "noteBodyInput";
  bodyInput.value = note.body;
  bodyInput.placeholder = "Write your note here...";

  bodyInput.style.width = "100%";
  bodyInput.style.minHeight = "180px";
  bodyInput.style.boxSizing = "border-box";
  bodyInput.style.padding = "10px";
  bodyInput.style.fontSize = "15px";
  bodyInput.style.resize = "vertical";
  bodyInput.style.fontFamily = "inherit";

  // Save button
  const saveButton = document.createElement("button");
  saveButton.textContent = "Save Changes";
  saveButton.style.padding = "8px 14px";
  saveButton.style.marginTop = "10px";
  saveButton.style.cursor = "pointer";

  // Delete button
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete Note";
  deleteButton.style.padding = "8px 14px";
  deleteButton.style.marginTop = "10px";
  deleteButton.style.marginLeft = "8px";
  deleteButton.style.cursor = "pointer";
  deleteButton.style.backgroundColor = "#EC6B5E";
  deleteButton.style.color = "white";
  deleteButton.style.border = "none";
  deleteButton.style.borderRadius = "6px";

  // Status message
  const statusText = document.createElement("span");
  statusText.style.display = "block";
  statusText.style.marginTop = "8px";
  statusText.style.fontSize = "12px";

  // Save edits
  saveButton.addEventListener("click", function () {
    const latestNote = content.find(item => item.id === id);

    if (!latestNote) return;

    const newTitle = titleInput.value.trim();

    if (!newTitle) {
      alert("Please enter a title for your note.");
      titleInput.focus();
      return;
    }

    const previousNote = { ...latestNote };

    latestNote.title = newTitle;
    latestNote.body = bodyInput.value;
    latestNote.updatedAt = new Date().toISOString();

    if (saveNotes()) {
      updateDateText();
      statusText.textContent = "Saved!";
      renderSidebar();
    } else {
      Object.assign(latestNote, previousNote);
    }
  });

  // Delete this note
  deleteButton.addEventListener("click", function () {
    deleteNote(id);
  });

  noteContentArea.append(
    titleInput,
    dateText,
    bodyInput,
    saveButton,
    deleteButton,
    statusText
  );

  renderSidebar();
}


/* =========================
   GENERATE THE SIDEBAR
========================= */

function renderSidebar() {
  if (!sidebar) return;

  sidebar.replaceChildren();

  // Sidebar heading
  const heading = document.createElement("p");
  heading.textContent = "My notes";
  heading.style.fontWeight = "bold";
  sidebar.appendChild(heading);

  // Add Entry button
  const addButton = document.createElement("button");
  addButton.textContent = "+ Add Entry";
  addButton.style.width = "100%";
  addButton.style.padding = "9px";
  addButton.style.marginBottom = "12px";
  addButton.style.cursor = "pointer";

  addButton.addEventListener("click", addNote);
  sidebar.appendChild(addButton);

  // Add each note to the sidebar
  content.forEach(function (note) {
    const entry = document.createElement("button");

    entry.type = "button";
    entry.style.display = "block";
    entry.style.width = "100%";
    entry.style.boxSizing = "border-box";
    entry.style.padding = "10px";
    entry.style.marginBottom = "8px";
    entry.style.border = "none";
    entry.style.borderRadius = "6px";
    entry.style.textAlign = "left";
    entry.style.cursor = "pointer";

    entry.style.backgroundColor =
      note.id === selectedNoteId ? "#d8e8ff" : "white";

    const title = document.createElement("strong");
    title.textContent = note.title;

    const date = document.createElement("small");
    date.style.display = "block";
    date.style.marginTop = "4px";
    date.style.color = "#666";
    date.textContent = formatDate(note.updatedAt);

    entry.append(title, date);

    entry.addEventListener("click", function () {
      showNote(note.id);
    });

    sidebar.appendChild(entry);
  });
}


/* =========================
   START NOTEPEDIA
========================= */

if (sidebar && noteContentArea) {
  renderSidebar();

  if (selectedNoteId) {
    showNote(selectedNoteId);
  } else {
    noteContentArea.textContent =
      "No notes yet. Click + Add Entry to create one.";
  }
}
