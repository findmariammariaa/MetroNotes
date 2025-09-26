document.addEventListener("DOMContentLoaded", () => {
  const notesGrid = document.getElementById("notes-grid"); 
  const recentUploads = document.getElementById("recent-uploads"); 

  // === SESSION LOGIC ===
  const token = localStorage.getItem("token");

  async function handleSession() {
    const header = document.getElementById("header");
    if (!header) return;

    const signUpBtn = header.querySelector(".signup-btn");
    const loginBtn = header.querySelector(".login-btn");

    if (token) {
      // Hide signup/login
      if (signUpBtn) signUpBtn.style.display = "none";
      if (loginBtn) loginBtn.style.display = "none";

      // Add logout button if not already present
      let logoutBtn = header.querySelector(".logout-btn");
      if (!logoutBtn) {
        logoutBtn = document.createElement("button");
        logoutBtn.className =
          "logout-btn px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ml-2";
        logoutBtn.innerText = "Logout";
        header.querySelector(".nav-buttons")?.appendChild(logoutBtn);
      }

      // Logout click handler
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "../index.html"; // redirect to home/index
      });
    } else {
      // Not logged in → show signup/login buttons
      if (signUpBtn) signUpBtn.style.display = "inline-block";
      if (loginBtn) loginBtn.style.display = "inline-block";
    }
  }

  // === HEADER LOADER ===
  const loadHeader = async () => {
    const el = document.getElementById("header");
    if (!el) return;

    try {
      const res = await fetch("/components/header.html");
      const html = await res.text();
      el.innerHTML = html;

      // Handle signup/login/logout visibility
      handleSession();
    } catch (err) {
      console.error("Failed to load header:", err);
    }
  };

  // === FOOTER LOADER ===
  const loadFooter = async () => {
    const el = document.getElementById("footer");
    if (!el) return;
    try {
      const res = await fetch("/components/footer.html");
      const html = await res.text();
      el.innerHTML = html;
    } catch (err) {
      console.error("Failed to load footer:", err);
    }
  };

  // Load header/footer
  loadHeader();
  loadFooter();

  // ================== Notes Loading & Upload Logic ==================
  async function loadNotes() {
    try {
      const response = await fetch("https://metronotes.onrender.com/api/notes");
      const data = await response.json();
      const notes = data.notes || [];

      const recentNotes = [...notes]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6);

      const mostDownloadedNotes = [...notes]
        .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
        .slice(0, 6);

      recentNotes.forEach((note) => {
        const card = createNoteCard(note, { showDownloads: false, showUploadedDate: true });
        recentUploads.appendChild(card);
      });

      mostDownloadedNotes.forEach((note) => {
        const card = createNoteCard(note, { showDownloads: true, showUploadedDate: false });
        notesGrid.appendChild(card);
      });
    } catch (err) {
      console.error("Failed to load notes:", err);
    }
  }

  function createNoteCard(note, { showDownloads, showUploadedDate }) {
    const daysAgo = getDaysAgo(note.createdAt);
    const card = document.createElement("div");
    card.className =
      "bg-white border border-gray-200 rounded-md lg:rounded-xl lg:p-6 p-2 shadow hover:shadow-lg transition-all hover:scale-105 cursor-pointer";

    card.innerHTML = `
      <div class="lg:mb-4">
        <h2 class="lg:text-2xl text-lg font-bold text-gray-800">${note.courseName}</h2>
        <p class="text-sm text-gray-600">${note.courseCode} – ${note.title || ""} ${note.section || ""}</p>
        <p class="text-sm text-gray-600">
          Department: <span class="font-medium text-gray-700">${note.department}</span>
        </p>
      </div>

      <p class="text-sm text-gray-600 lg:mb-4">
        Uploaded by: <span class="font-bold text-gray-700">${note.uploaderName || "Anonymous"}</span>
      </p>

      <div class="text-sm">
        ${showDownloads ? `<span>📥 ${note.downloadCount || 0} Downloads</span>` : ""}
        ${showUploadedDate ? `<span class="text-gray-500">Uploaded ${daysAgo}</span>` : ""}
      </div>

      <div class="text-sm text-gray-600 mt-4">
        <div class="flex gap-4 text-sm">
        <a 
          href="https://metronotes.onrender.com/api/notes/view/${note._id}" 
          target="_blank" 
          rel="noopener noreferrer"
          class="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition"
        >
          📄 <span>View</span>
        </a>

        <a 
          href="https://metronotes.onrender.com/api/notes/download/${note._id}" 
          target="_blank"
          class="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition"
        >
          📥 <span>Download</span>
        </a>
        </div>
      </div>
    `;

    return card;
  }

  function getDaysAgo(dateStr) {
    const createdDate = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - createdDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? "today" : `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }

  // Load notes initially
  loadNotes();
});
