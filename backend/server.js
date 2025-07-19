// Load environment variables FIRST - before any other imports
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const notesRoutes = require("./routes/notes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Database connection
mongoose
  .connect("mongodb://localhost:27017/metronotes")
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/auth",
      notes: "/api/notes",
    },
  });
});

// API info route
app.get("/api", (req, res) => {
  res.json({
    message: "MetroNotes API",
    version: "1.0.0",
    endpoints: {
      authentication: {
        signup: "POST /api/auth/signup",
        login: "POST /api/auth/login",
        profile: "GET /api/auth/profile",
      },
      notes: {
        upload: "POST /api/notes/upload",
        getAllNotes: "GET /api/notes",
        getNotesByDepartment: "GET /api/notes/department/:department",
        getSingleNote: "GET /api/notes/:id",
        getUserNotes: "GET /api/notes/user/my-notes",
        updateDownloadCount: "PATCH /api/notes/:id/download",
        deleteNote: "DELETE /api/notes/:id",
        getDepartmentStats: "GET /api/notes/stats/departments",
      },
    },
  });
});

// Simple 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    availableRoutes: ["/api/auth", "/api/notes", "/api/health"],
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File too large. Maximum size is 10MB.",
    });
  }

  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({
      message: err.message,
    });
  }

  // Default error
  res.status(500).json({
    message: "Server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/api`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
});
