// Load environment variables FIRST - before any other imports
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const notesRoutes = require("./routes/notes");

const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || "https://your-frontend-domain.com"
      : [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3000",
        ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "20mb" })); 
app.use(express.urlencoded({ extended: true, limit: "20mb" })); 

// Database connection
const mongoUri =
  process.env.MONGO_URI || "mongodb://localhost:27017/metronotes";

mongoose
  .connect(process.env.MONGO_URI, {
    tls: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
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
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      auth: "/api/auth",
      notes: "/api/notes",
    },
  });
});

// Updated API info route with all endpoints
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
        getDepartmentStats: "GET /api/notes/stats/departments",
        downloadFile: "GET /api/notes/download/:id", 
        viewFile: "GET /api/notes/view/:id", 
        getFileInfo: "GET /api/notes/info/:id", 
        deleteNote: "DELETE /api/notes/:id",
      },
    },
    limits: {
      maxFileSize: "20MB",
      allowedFormats: [
        "pdf",
        "doc",
        "docx",
        "txt",
        "ppt",
        "pptx",
        "jpg",
        "jpeg",
        "png",
      ],
    },
  });
});

// Simple 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    availableRoutes: ["/api/auth", "/api/notes", "/api/health", "/api"],
  });
});

// Enhanced error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File too large. Maximum size is 20MB.", // Updated to match cloudinary
    });
  }

  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({
      message: err.message,
    });
  }

  // Cloudinary errors
  if (err.message && err.message.includes("cloudinary")) {
    return res.status(500).json({
      message: "File upload service error. Please try again.",
    });
  }

  // MongoDB errors
  if (err.name === "MongoError" || err.name === "MongooseError") {
    return res.status(500).json({
      message: "Database error. Please try again.",
    });
  }

  // JWT errors (if they bubble up)
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      message: "Invalid authentication token.",
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
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📁 Max file size: 20MB`);
});
