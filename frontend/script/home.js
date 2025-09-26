document.addEventListener("DOMContentLoaded", () => {
  const notesGrid = document.getElementById("notes-grid"); // Featured
  const recentUploads = document.getElementById("recent-uploads"); // Recently Uploaded

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

      // Recently Uploaded section
      recentNotes.forEach(note => {
        const card = createNoteCard(note, { showDownloads: false, showUploadedDate: true });
        recentUploads.appendChild(card);
      });

      // Featured section
      mostDownloadedNotes.forEach(note => {
        const card = createNoteCard(note, { showDownloads: true, showUploadedDate: false });
        notesGrid.appendChild(card);
      });

    } catch (error) {
      console.error("Failed to load notes:", error);
    }
  }

  function createNoteCard(note, { showDownloads, showUploadedDate }){
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
        ${showDownloads ? `<span>📥 ${note.downloadCount || 0} Downloads</span>` : "<span></span>"}
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

  loadNotes();

  
  const logoutBtn = document.getElementById("logoutBtn");

  const token = localStorage.getItem("token");

  if (!token) {
    // Not logged in, redirect to login
    window.location.href = "../others/login.html";
    return;
  }

  fetch("https://metronotes.onrender.com/api/auth/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((user) => {
      console.log("Logged in user:", user);
    })
    .catch((err) => {
      console.error("Profile fetch failed", err);
      localStorage.removeItem("token");
      window.location.href = "../others/login.html";
    });
  console.log(logoutBtn);
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token"); // Remove JWT token
      window.location.href = "../index.html"; // Redirect to login page
    });
  }
  document
    .getElementById("uploadForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      console.log("Upload form submitted");
      const form = e.target;
      const formData = new FormData();

      formData.append(
        "uploaderName",
        form.querySelector('input[name="uploaderName"]').value
      );
      formData.append(
        "uploaderId",
        form.querySelector('input[name="uploaderId"]').value
      );
      formData.append(
        "department",
        form.querySelector('select[name="department"]').value
      );
      formData.append(
        "courseName",
        form.querySelector('input[name="courseName"]').value
      );
      formData.append(
        "courseCode",
        form.querySelector('input[name="courseCode"]').value
      );
      formData.append(
        "file",
        form.querySelector('input[name="file"]').files[0]
      );
      formData.append("title", form.querySelector('input[name="title"]').value); // text

      try {
        const response = await fetch("https://metronotes.onrender.com/api/notes/upload", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (response.ok) {
          showToast("Note uploaded successfully!", "success");
          form.reset();
          document.getElementById("upload_modal").close();
          loadNotes(); // Optional: reload recently uploaded notes
        } else {
          showToast("Upload failed: " + result.message, "error");

        }
      } catch (err) {
        console.error(err);
        showToast("An unexpected error occurred.", "error");
      }
    });
    async function loadRecentNotes() {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch("https://metronotes.onrender.com/api/notes/recent", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const notes = await response.json();

    if (!response.ok) {
      throw new Error(notes.message || "Failed to load notes");
    }

    const container = document.getElementById("recentNotesGrid");

    container.innerHTML = ""; // Clear previous static items

    notes.forEach((note) => {
      const noteCard = document.createElement("div");
      noteCard.className =
        "bg-white border rounded-lg p-6 shadow hover:shadow-lg transition-all flex items-start space-x-4";

      const daysAgo = getDaysAgo(note.createdAt);

      noteCard.innerHTML = `
        <img
          src="https://img.icons8.com/fluency/48/upload.png"
          alt="Upload"
          class="w-10 h-10"
        />
        <div>
          <h3 class="text-lg font-semibold text-gray-800">
            ${note.title}
          </h3>
          <p class="text-sm text-gray-600">Uploaded ${daysAgo}</p>
          <a href="https://metronotes.onrender.com/uploads/${note.file}" 
             class="text-blue-600 underline text-sm mt-2 inline-block" download>
            Download
          </a>
        </div>
      `;

      container.appendChild(noteCard);
    });
  } catch (err) {
    console.error("Error loading recent notes:", err);
    
  }
}

function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toast");

  const bg =
    type === "error"
      ? "bg-red-500"
      : type === "success"
      ? "bg-green-600"
      : "bg-gray-700";

  const toast = document.createElement("div");
  toast.className = `alert ${bg} text-white px-4 py-2 rounded shadow mb-2 font-semibold`;
  toast.innerText = message;

  toastContainer.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
  document.querySelectorAll(".dept-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const selectedDept = btn.getAttribute("data-dept");
      // Redirect to browse page with department filter
      window.location.href = `../others/browse.html?department=${encodeURIComponent(selectedDept)}`;
    });
  });
});
