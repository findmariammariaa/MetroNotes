document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const fullName = form.fullName.value.trim();
  const studentId = form.studentId.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;

  const errorBox = document.getElementById("signupError");
  errorBox.textContent = ""; // Clear previous errors

  // Client-side validation
  if (!fullName || !email || !studentId || !password || !confirmPassword) {
    errorBox.textContent = "Please fill in all required fields.";
    return;
  }

  if (password !== confirmPassword) {
    errorBox.textContent = "Passwords do not match.";
    return;
  }

  const studentIdPattern = /^\d{3}-\d{3}-\d{3}$/;
  if (!studentIdPattern.test(studentId)) {
    errorBox.textContent = "Student ID must be in format 123-456-789.";
    return;
  }

  if (password.length < 8) {
    errorBox.textContent = "Password must be at least 8 characters long.";
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fullName,
        email,
        studentId,
        phone,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      errorBox.textContent = data.message || "Signup failed.";
      return;
    }

    showToast("Signup successful!", "success");

    setTimeout(() => {
      window.location.href = "../others/login.html";
    }, 1500);
  } catch (err) {
    console.error(err);
    errorBox.textContent = "Something went wrong. Please try again later.";
  }
});

// 👁️ Toggle eye icon
document.getElementById("togglePassword").addEventListener("click", () => {
  const input = document.getElementById("password");
  const eyeOpen = document.getElementById("eyeOpen");
  const eyeClosed = document.getElementById("eyeClosed");
  const isVisible = input.type === "text";
  input.type = isVisible ? "password" : "text";
  eyeOpen.classList.toggle("hidden", isVisible);
  eyeClosed.classList.toggle("hidden", !isVisible);
});
document.getElementById("togglePassword2").addEventListener("click", () => {
  const input = document.getElementById("confirmPassword");
  const eyeOpen = document.getElementById("eyeOpen2");
  const eyeClosed = document.getElementById("eyeClosed2");
  const isVisible = input.type === "text";
  input.type = isVisible ? "password" : "text";
  eyeOpen.classList.toggle("hidden", isVisible);
  eyeClosed.classList.toggle("hidden", !isVisible);
});

// 🔍 Live Password Validation
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirmPassword");
const matchMessage = document.getElementById("matchMessage");

passwordInput.addEventListener("input", () => {
  const val = passwordInput.value;

  document.getElementById("rule-length").className =
    val.length >= 8 ? "text-green-600" : "text-red-500";
  document.getElementById("rule-uppercase").className = /[A-Z]/.test(val)
    ? "text-green-600"
    : "text-red-500";
  document.getElementById("rule-lowercase").className = /[a-z]/.test(val)
    ? "text-green-600"
    : "text-red-500";
  document.getElementById("rule-number").className = /\d/.test(val)
    ? "text-green-600"
    : "text-red-500";
  document.getElementById("rule-special").className =
    /[!@#$%^&*(),.?\":{}|<>]/.test(val) ? "text-green-600" : "text-red-500";

  checkPasswordMatch();
});

confirmInput.addEventListener("input", checkPasswordMatch);

// ✅ Match Checker
function checkPasswordMatch() {
  const password = passwordInput.value;
  const confirm = confirmInput.value;

  if (!confirm) {
    matchMessage.textContent = "";
    return;
  }

  if (password === confirm) {
    matchMessage.textContent = "✅ Passwords match";
    matchMessage.classList.remove("text-red-500");
    matchMessage.classList.add("text-green-600");
  } else {
    matchMessage.textContent = "❌ Passwords do not match";
    matchMessage.classList.remove("text-green-600");
    matchMessage.classList.add("text-red-500");
  }
}
function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toast");

  const bg =
    type === "error"
      ? "bg-red-500"
      : type === "success"
      ? "bg-green-600"
      : "bg-gray-700";

  const toast = document.createElement("div");
  toast.className = `alert ${bg} text-white px-4 py-2 rounded shadow mb-2 font-semibold`;
  toast.innerText = message;

  toastContainer.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
