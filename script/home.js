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
      console.log(logoutBtn)
    if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token"); // Remove JWT token
      window.location.href = "../index.html"; // Redirect to login page
    });
  }
});
