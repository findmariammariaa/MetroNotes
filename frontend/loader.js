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

    // Hide "Sign Up" on signup page
    if (path.includes("signup.html")) {
      const signUpBtn = document.querySelector("#header .signup-btn");
      if (signUpBtn) signUpBtn.style.display = "none";
    }

    // Hide "Login" on login page
    if (path.includes("login.html")) {
      const loginBtn = document.querySelector("#header .login-btn");
      if (loginBtn) loginBtn.style.display = "none";
    }

    // === SESSION LOGIC ===
    // Example: check if "userSession" exists in localStorage
    const userSession = localStorage.getItem("userSession"); // Or fetch from cookie/API

    const signUpBtn = document.querySelector("#header .signup-btn");
    const loginBtn = document.querySelector("#header .login-btn");
    
    if (userSession) {
      // User is logged in → hide sign up/login, show logout
      if (signUpBtn) signUpBtn.style.display = "none";
      if (loginBtn) loginBtn.style.display = "none";

      // Create Logout button dynamically
      let logoutBtn = document.querySelector("#header .logout-btn");
      if (!logoutBtn) {
        logoutBtn = document.createElement("button");
        logoutBtn.className = "logout-btn px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600";
        logoutBtn.innerText = "Logout";
        document.querySelector("#header .nav-buttons")?.appendChild(logoutBtn);
      }

      // Logout click handler
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("userSession"); // Clear session
        window.location.reload(); // Reload page to show login/signup again
      });
    }
  });

  // === FOOTER LOADER ===
  load("footer", "/components/footer.html");
});
