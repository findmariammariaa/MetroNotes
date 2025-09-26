document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
    // Loader functions
function showLoader() {
  const loader = document.getElementById("global-loader");
  if (!loader) return;
  loader.classList.remove("opacity-0", "pointer-events-none");
  loader.classList.add("opacity-100");
}

function hideLoader() {
  const loader = document.getElementById("global-loader");
  if (!loader) return;
  loader.classList.remove("opacity-100");
  loader.classList.add("opacity-0", "pointer-events-none");
}



  const emailOrId = loginForm.emailOrId.value.trim();

  const password = e.target.password.value;

  try {
    showLoader();
    const response = await fetch("https://metronotes.onrender.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrId: emailOrId, password: password }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Login failed");
    // Save the token in localStorage
    localStorage.setItem("token", data.token);
    window.location.href = "../home.html";
    hideLoader();
    showToast("Login successful!", "success");

  } catch (err) {
    showToast("Login failed", "error");
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
});
