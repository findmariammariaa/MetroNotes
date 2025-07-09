document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const emailOrId = loginForm.emailOrId.value.trim();

  const password = e.target.password.value;

  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrId: emailOrId, password: password }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Login failed");
    // Save the token in localStorage
    localStorage.setItem("token", data.token);
    alert("Login successful!");
    window.location.href = "../home.html";

  } catch (err) {
    alert(err.message);
  }
});
