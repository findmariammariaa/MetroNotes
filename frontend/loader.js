document.addEventListener("DOMContentLoaded", () => {
  // Load external HTML components into the page
  const load = async (id, path, callback) => {
    const el = document.getElementById(id);
    if (el) {
      try {
        const res = await fetch(path);
        const html = await res.text();
        el.innerHTML = html;
        if (callback) callback(); // Execute callback after insertion
      } catch (error) {
        console.error(`Error loading ${path}:`, error);
      }
    }
  };

  // === HEADER LOADER ===
  load("header", "/components/header.html", () => {
    const path = window.location.pathname;

    const token = localStorage.getItem("token");
    const signUpBtn = document.querySelector("#header .signup-btn");
    const loginBtn = document.querySelector("#header .login-btn");

    if (token) {
      // Hide signup/login
      if (signUpBtn) signUpBtn.style.display = "none";
      if (loginBtn) loginBtn.style.display = "none";

      // Add logout button dynamically
      let logoutBtn = document.querySelector("#header .logout-btn");
      if (!logoutBtn) {
        logoutBtn = document.createElement("button");
        logoutBtn.className = "logout-btn px-4 py-2 bg-red-500 text-white rounded";
        logoutBtn.innerText = "Logout";
        document.querySelector("#header .nav-buttons")?.appendChild(logoutBtn);
      }

      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.reload();
      });
    } else {
      // Show signup/login if not logged in
      if (signUpBtn) signUpBtn.style.display = "inline-block";
      if (loginBtn) loginBtn.style.display = "inline-block";
    }

    // === PAGE-SPECIFIC TWEAKS ===
    if (path.includes("signup.html") && signUpBtn) signUpBtn.style.display = "none";
    if (path.includes("login.html") && loginBtn) loginBtn.style.display = "none";
  });

  // === FOOTER LOADER ===
  load("footer", "/components/footer.html");
});
