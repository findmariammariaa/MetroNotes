const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const { validatePassword, validateStudentId } = require("../utils/validation"); // ✅ Import validation
const router = express.Router();

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, studentId, phone } = req.body;

    // Basic validation
    if (!name || !email || !password || !studentId) {
      return res.status(400).json({
        message: "Name, email, password, and Student ID are required",
      });
    }

    // VALIDATE PASSWORD BEFORE HASHING
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: "Password validation failed",
        errors: passwordValidation.errors,
      });
    }

    // VALIDATE STUDENT ID FORMAT
    const studentIdValidation = validateStudentId(studentId);
    if (!studentIdValidation.isValid) {
      return res.status(400).json({
        message: "Student ID validation failed",
        errors: studentIdValidation.errors,
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Check if studentId exists
    const existingStudentId = await User.findOne({
      studentId: studentId.trim(),
    });
    if (existingStudentId) {
      return res.status(400).json({ message: "Student ID already registered" });
    }

    // Hash password AFTER validation
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword, // ✅ Now hashed password goes to DB
      studentId: studentId.trim(),
      phone: phone || "",
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET, // No fallback
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);

    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        message: `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } already exists`,
      });
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors,
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// Login route - updated to accept studentId or email
router.post("/login", async (req, res) => {
  try {
    const { emailOrId, password } = req.body;

    if (!emailOrId || !password) {
      return res
        .status(400)
        .json({ message: "Email/Student ID and password are required" });
    }

    // Detect if emailOrId is student ID format
    let user;
    if (/^\d{3}-\d{3}-\d{3}$/.test(emailOrId)) {
      user = await User.findOne({ studentId: emailOrId });
    } else {
      user = await User.findOne({ email: emailOrId });
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Test route to verify auth routes are working
router.get("/test", (req, res) => {
  res.json({ message: "Auth routes are working!" });
});

module.exports = router;
