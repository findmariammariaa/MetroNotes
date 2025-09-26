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
  });

  // === FOOTER LOADER ===
  load("footer", "/components/footer.html");
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
const modalLoader = document.getElementById("modal-loader");

function showModalLoader() {
  if (modalLoader) modalLoader.classList.remove("hidden");
}

function hideModalLoader() {
  if (modalLoader) modalLoader.classList.add("hidden");
}

});
