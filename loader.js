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

    // === PAGE-SPECIFIC TWEAKS ===

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

    // === HOMEPAGE CUSTOM NAV ===
    if (path.endsWith("/home.html") || path === "/") {
      // Remove default nav sections
      const navLinks = document.querySelector(".header-links");
      const authButtons = document.querySelector(".header-auth");
      const mobileMenu = document.querySelector(".header-mobile-menu");
      if (navLinks) navLinks.remove();
      if (authButtons) authButtons.remove();
      if (mobileMenu) mobileMenu.innerHTML = "";

      // Insert new buttons in navbar
      const navContainer = document.querySelector(
        "nav .flex.justify-between.items-center"
      );
      if (navContainer) {
        const customBtns = document.createElement("div");
        customBtns.className = "flex-none space-x-4 items-center";
        customBtns.innerHTML = `
          <a class="btn btn-ghost text-xl">Browse Notes</a>
          <a class="btn btn-ghost text-xl">Upload Notes</a>
          <a href="../others/login.html">
            <button class="btn bg-blue-950 rounded-md text-white login-btn text-xl">Log Out</button>
          </a>
        `;
        navContainer.appendChild(customBtns);
      }

      // Make navbar sticky
      const navbar = document.getElementById("main-navbar");
      if (navbar) {
        navbar.classList.add("sticky", "top-0", "z-50");
      }
    }
  });

  // === FOOTER LOADER ===
  load("footer", "/components/footer.html");
});
