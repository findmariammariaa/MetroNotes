document.addEventListener("DOMContentLoaded", () => {
  
  const logoutBtn = document.getElementById("logoutBtn");

  const token = localStorage.getItem("token");

  if (!token) {
    // Not logged in, redirect to login
    window.location.href = "../others/login.html";
    return;
  }

  fetch("http://localhost:5000/api/auth/profile", {
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
        const response = await fetch("http://localhost:5000/api/notes/upload", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (response.ok) {
          alert("Note uploaded!");
          form.reset();
          document.getElementById("upload_modal").close();
          loadRecentNotes(); // Optional: reload recently uploaded notes
        } else {
          alert("Upload failed: " + result.message);
        }
      } catch (err) {
        console.error(err);
        alert("An error occurred.");
      }
    });
    async function loadRecentNotes() {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch("http://localhost:5000/api/notes/recent", {
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
          <a href="http://localhost:5000/uploads/${note.file}" 
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

function getDaysAgo(dateStr) {
  const createdDate = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now - createdDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 0 ? "today" : `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

});
