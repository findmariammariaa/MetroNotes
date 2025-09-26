document.addEventListener("DOMContentLoaded", () => {
  const load = async (id, path, callback) => {
    const el = document.getElementById(id);
    if (el) {
      try {
        const res = await fetch(path);
        const html = await res.text();
        el.innerHTML = html;
        if (callback) callback(); // execute tweaks after component loads
      } catch (error) {
        console.error(`Error loading ${path}:`, error);
      }
    }
  };

  const API_BASE_URL = "https://metronotes.onrender.com/api/auth";

  async function checkAuthStatus() {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) return true;
      localStorage.removeItem("token");
      return false;
    } catch {
      localStorage.removeItem("token");
      return false;
    }
  }

  // === HEADER LOADER ===
  load("header", "/components/header.html", async () => {
    const path = window.location.pathname;

    const loginBtn = document.querySelector("#header .login-btn");
    const signupBtn = document.querySelector("#header .signup-btn");
    const logoutBtn = document.querySelector("#header .logout-btn");

    const isLoggedIn = await checkAuthStatus();

    if (isLoggedIn) {
      if (loginBtn) loginBtn.style.display = "none";
      if (signupBtn) signupBtn.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "inline-block";
    } else {
      if (loginBtn) loginBtn.style.display = "inline-block";
      if (signupBtn) signupBtn.style.display = "inline-block";
      if (logoutBtn) logoutBtn.style.display = "none";
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        alert("Logged out successfully!");
        window.location.reload();
      });
    }

    // Page-specific tweaks
    if (path.includes("signup.html") && signupBtn) signupBtn.style.display = "none";
    if (path.includes("login.html") && loginBtn) loginBtn.style.display = "none";

    // getStarted button redirect
    const getStartedBtns = [document.getElementById("getStartedBtn"), document.getElementById("getStartedBtn2")];
    getStartedBtns.forEach(btn => {
      if (btn) {
        btn.addEventListener("click", () => {
          window.location.href = isLoggedIn ? "/home.html" : "/others/login.html";
        });
      }
    });
  });

  // === FOOTER LOADER ===
  load("footer", "/components/footer.html");
});
