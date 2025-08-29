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

  // === API BASE URL ===
  const API_BASE_URL = 'http://localhost:5000/api/auth';

  async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) return true;
      localStorage.removeItem('token');
      return false;
    } catch (error) {
      localStorage.removeItem('token');
      return false;
    }
  }

  // === ATTACH HANDLER TO getStartedBtn (hero section) ===
  const getStartedBtn = document.getElementById('getStartedBtn');
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', async () => {
      const isLoggedIn = await checkAuthStatus();
      window.location.href = isLoggedIn ? '/home.html' : '/others/login.html';
    });
  }

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

    // === SHOW/HIDE LOGIN/SIGNUP/LOGOUT BUTTONS BASED ON AUTH ===
    const loginBtn = document.querySelector("#header .login-btn");
    const signupBtn = document.querySelector("#header .signup-btn");
    const logoutBtn = document.querySelector("#header .logout-btn");

    const token = localStorage.getItem("token");
    if (token) {
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

    // ✅ ATTACH HANDLER TO getStartedBtn2 AFTER header is loaded
    const getStartedBtn2 = document.getElementById('getStartedBtn2');
    if (getStartedBtn2) {
      getStartedBtn2.addEventListener('click', async () => {
        const isLoggedIn = await checkAuthStatus();
        window.location.href = isLoggedIn ? '/home.html' : '/others/login.html';
      });
    }
  });

  // === FOOTER LOADER ===
  load("footer", "/components/footer.html");
});
