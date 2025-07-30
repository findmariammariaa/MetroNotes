const validatePassword = (password) => {
  const errors = [];

  if (!password) {
    errors.push("Password is required");
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Optional: Special character requirement
  if (!/[@$!%*?&]/.test(password)) {
    errors.push(
      "Password should contain at least one special character (@$!%*?&)"
    );
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// NEW: Student ID validation for XXX-XXX-XXX format
const validateStudentId = (studentId) => {
  const errors = [];

  if (!studentId) {
    errors.push("Student ID is required");
    return { isValid: false, errors };
  }

  // Remove any spaces
  const cleanId = studentId.replace(/\s/g, "");

  // Check format: exactly 3 digits, dash, 3 digits, dash, 3 digits
  if (!/^\d{3}-\d{3}-\d{3}$/.test(cleanId)) {
    errors.push("Student ID must be in format XXX-XXX-XXX (e.g., 222-115-234)");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

module.exports = {
  validatePassword,
  validateEmail,
  validateStudentId,
};
