document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token"); // Remove JWT token
      window.location.href = "./others/login.html"; // Redirect to login page
    });
  }

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
      // You can show the user's name in navbar, like:
      const navbar = document.getElementById("main-navbar");
      if (navbar) {
        navbar.innerHTML += `<p class="text-white">Hi, ${user.fullName}</p>`;
      }
    })
    .catch((err) => {
      console.error("Profile fetch failed", err);
      localStorage.removeItem("token");
      window.location.href = "../others/login.html";
    });
});
