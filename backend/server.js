// Load environment variables FIRST
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const notesRoutes = require("./routes/notes");

const app = express();

// ✅ Allow only your frontend and local dev for security
const allowedOrigins = [
  "https://metronotes-6oe8.onrender.com", // Your Render frontend
  "https://metronotes.onrender.com3000", // for local testing
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ✅ Middleware
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ✅ Database connection
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is not set in environment variables");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);

// ✅ Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    frontend: "https://metronotes-6oe8.onrender.com",
    endpoints: {
      auth: "/api/auth",
      notes: "/api/notes",
    },
  });
});

// ✅ API info route
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
        downloadFile: "GET /api/notes/download/:id",
        viewFile: "GET /api/notes/view/:id",
      },
    },
  });
});

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    availableRoutes: ["/api/auth", "/api/notes", "/api/health"],
  });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File too large. Maximum size is 10MB.",
    });
  }

  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({
    message: "Server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 API Docs: https://metronotes.onrender.com${PORT}/api`);
  console.log(`🔍 Health Check: https://metronotes.onrender.com${PORT}/api/health`);
});
