document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullName = e.target.fullName.value;
  const studentId = e.target.studentId.value;
  const email = e.target.email.value;
  const phone = e.target.phone.value;
  const password = e.target.password.value;
  const confirmPassword = e.target.confirmPassword.value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, studentId, email, phone, password }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Signup failed");

    alert("Signup successful! Please log in.");
    window.location.href = "../others/login.html";
  } catch (err) {
    alert(err.message);
  }
});
