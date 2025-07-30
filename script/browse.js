document.addEventListener("DOMContentLoaded", () => {
  const departmentFilter = document.getElementById("filter-department");
  const courseFilter = document.getElementById("filter-course");
  const searchInput = document.getElementById("filter-search");
  const notesGrid = document.getElementById("notes-grid");

  // Listen for filter changes
  departmentFilter.addEventListener("change", fetchFilteredNotes);
  courseFilter.addEventListener("change", fetchFilteredNotes);
  searchInput.addEventListener("input", debounce(fetchFilteredNotes, 300));

  async function fetchFilteredNotes() {
    const department = departmentFilter.value;
    const courseName = courseFilter.value;
    const search = searchInput.value;

    const queryParams = new URLSearchParams({
      ...(department && { department }),
      ...(courseName && { courseName }),
      ...(search && { search }),
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    try {
      const response = await fetch(`http://localhost:5000/api/notes?${queryParams.toString()}`);
      const data = await response.json();
      renderNotes(data.notes);
    } catch (err) {
      console.error("Error fetching filtered notes:", err);
    }
  }

  function renderNotes(notes) {
    notesGrid.innerHTML = "";

    notes.forEach(note => {
      const card = document.createElement("div");
      card.className = "bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300";

      card.innerHTML = `
        <div class="mb-4">
          <h2 class="text-2xl font-bold text-gray-800">Course: ${note.courseName}</h2>
          <p class="text-sm text-gray-600">${note.courseCode} – ${note.title}</p>
          <p class="text-sm text-gray-600">Department: <span class="font-medium text-gray-700">${note.department}</span></p>
        </div>

        <div class="flex items-center justify-between mb-4 text-sm text-gray-500">
          <div>
            Uploaded by: 
            <span class="font-semibold text-gray-700">
              ${note.uploader?.name || "Anonymous"} (${note.uploader?.studentId || "N/A"})
            </span>
          </div>
        </div>

        <div class="flex gap-4 text-sm">
          <a 
            href="${note.fileUrl}?fl_attachment=false" 
            target="_blank" 
            rel="noopener noreferrer"
            class="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition"
          >
            📄 <span>View</span>
          </a>

          <a 
            href="${note.fileUrl}?fl_attachment=true" 
            class="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition"
            download
          >
            📥 <span>Download</span>
          </a>
        </div>
      `;
      notesGrid.appendChild(card);
    });
  }

  // Debounce helper
  function debounce(func, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Initial load
  fetchFilteredNotes();
});
