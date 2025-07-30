const express = require("express");
const Note = require("../models/Note");
const auth = require("../middleware/authMiddleware");
const { upload, cloudinary } = require("../config/cloudinary");
const router = express.Router();

// Enhanced upload route with detailed logging
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    console.log("=== UPLOAD ROUTE STARTED ===");
    console.log("Request body:", req.body);
    console.log("File info:", req.file);

    // Check Cloudinary config
    console.log("Cloudinary config check:", {
      cloud_name: cloudinary.config().cloud_name,
      api_key: cloudinary.config().api_key ? "SET" : "MISSING",
      api_secret: cloudinary.config().api_secret ? "SET" : "MISSING",
    });

    // Extract and clean form data (remove extra quotes)
    const cleanString = (str) => {
      if (!str) return str;
      return str.replace(/^["']|["']$/g, "").trim();
    };

    const {
      uploaderName,
      uploaderId,
      department,
      courseName,
      courseCode,
      title,
    } = req.body;

    // Clean the data
    const cleanedData = {
      uploaderName: cleanString(uploaderName),
      uploaderId: cleanString(uploaderId),
      department: cleanString(department),
      courseName: cleanString(courseName),
      courseCode: cleanString(courseCode),
      title: cleanString(title),
    };

    console.log("Cleaned request data:", cleanedData);

    // Validate required fields
    if (
      !cleanedData.department ||
      !cleanedData.courseName ||
      !cleanedData.courseCode ||
      !cleanedData.title
    ) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        message: "Department, course name, course code, and title are required",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      console.log("❌ No file uploaded");
      return res.status(400).json({
        message: "Please upload a file",
      });
    }

    // Get the correct Cloudinary URL and public_id
    const fileUrl = req.file.secure_url || req.file.path;
    const cloudinaryId = req.file.public_id || req.file.filename;

    console.log("✅ File uploaded successfully to Cloudinary:", {
      url: fileUrl,
      public_id: cloudinaryId,
      original_filename: req.file.originalname,
      filename: req.file.filename,
    });

    // Validate that we have the required Cloudinary data
    if (!fileUrl || !cloudinaryId) {
      console.log("❌ Missing Cloudinary file data");
      return res.status(500).json({
        message: "File upload failed - missing file data",
      });
    }

    // Create note document
    const note = new Note({
      title: cleanedData.title,
      uploaderName: cleanedData.uploaderName || "Anonymous",
      uploaderId: cleanedData.uploaderId || req.user,
      department: cleanedData.department,
      courseName: cleanedData.courseName,
      courseCode: cleanedData.courseCode,
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      cloudinaryId: cloudinaryId,
      uploader: req.user,
    });

    console.log("Note data before saving:", {
      title: note.title,
      department: note.department,
      courseName: note.courseName,
      courseCode: note.courseCode,
      fileUrl: note.fileUrl,
      fileName: note.fileName,
      cloudinaryId: note.cloudinaryId,
    });

    console.log("Saving note to database...");
    await note.save();
    console.log("✅ Note saved successfully");

    res.status(201).json({
      message: "Note uploaded successfully",
      note: {
        id: note._id,
        title: note.title,
        department: note.department,
        courseName: note.courseName,
        courseCode: note.courseCode,
        fileUrl: note.fileUrl,
        fileName: note.fileName,
        uploadedAt: note.createdAt,
      },
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);

    // Clean up uploaded file if note creation fails
    if (req.file && (req.file.public_id || req.file.filename)) {
      try {
        console.log("Cleaning up uploaded file...");
        const publicId = req.file.public_id || req.file.filename;
        await cloudinary.uploader.destroy(publicId);
        console.log("✅ File cleanup successful");
      } catch (cleanupError) {
        console.error("❌ Cleanup error:", cleanupError);
      }
    }

    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      console.log("❌ Validation errors:", errors);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors,
      });
    }

    res.status(500).json({
      message: "Server error during upload",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});
// Get all notes with filtering and search
router.get("/", async (req, res) => {
  try {
    const {
      department,
      courseName,
      courseCode,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = {};

    if (department) {
      filter.department = department;
    }

    if (courseName) {
      filter.courseName = { $regex: courseName, $options: "i" };
    }

    if (courseCode) {
      filter.courseCode = { $regex: courseCode, $options: "i" };
    }

    // Handle text search
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { courseName: { $regex: search, $options: "i" } },
        { courseCode: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const notes = await Note.find(filter)
      .populate("uploader", "name email studentId")
      .select("-cloudinaryId")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await Note.countDocuments(filter);

    res.json({
      notes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        limit: parseInt(limit),
        hasNextPage: skip + notes.length < totalCount,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (err) {
    console.error("Get notes error:", err);
    res.status(500).json({ message: "Server error while fetching notes" });
  }
});

// Get notes by department
router.get("/department/:department", async (req, res) => {
  try {
    const { department } = req.params;
    const { page = 1, limit = 10, search } = req.query;

    const filter = {
      department: department.replace(/\+/g, " "),
    };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { courseName: { $regex: search, $options: "i" } },
        { courseCode: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notes = await Note.find(filter)
      .populate("uploader", "name email studentId")
      .select("-cloudinaryId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Note.countDocuments(filter);

    res.json({
      notes,
      department: department.replace(/\+/g, " "),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Get notes by department error:", err);
    res.status(500).json({ message: "Server error while fetching notes" });
  }
});

// Get single note by ID
router.get("/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate(
      "uploader",
      "name email studentId"
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(note);
  } catch (err) {
    console.error("Get note by ID error:", err);
    res.status(500).json({ message: "Server error while fetching note" });
  }
});
// Download route - forces file download with proper extension
router.get("/download/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Extract file extension from original filename
    const fileExtension = note.fileName.split(".").pop().toLowerCase();

    // Create a safe filename for download
    const safeTitle = note.title
      .replace(/[^a-zA-Z0-9\s\-_]/g, "")
      .replace(/\s+/g, "_");
    const downloadFileName = `${safeTitle}.${fileExtension}`;

    // Set proper MIME type based on file extension
    const mimeTypes = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
    };

    const mimeType = mimeTypes[fileExtension] || "application/octet-stream";

    console.log(
      `📥 File download: ${downloadFileName} by user: ${
        req.user || "anonymous"
      }`
    );

    // Set headers for download with proper filename
    res.set({
      "Content-Disposition": `attachment; filename="${downloadFileName}"`,
      "Content-Type": mimeType,
    });

    // Redirect to Cloudinary with download parameters
    const downloadUrl = note.fileUrl.includes("?")
      ? `${note.fileUrl}&fl_attachment=${encodeURIComponent(downloadFileName)}`
      : `${note.fileUrl}?fl_attachment=${encodeURIComponent(downloadFileName)}`;

    res.redirect(downloadUrl);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ message: "Server error while downloading file" });
  }
});

// View route - displays file in browser for preview
router.get("/view/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Extract file extension
    const fileExtension = note.fileName.split(".").pop().toLowerCase();

    // Set appropriate MIME type for inline viewing
    const mimeTypes = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain; charset=utf-8",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
    };

    const mimeType = mimeTypes[fileExtension] || "application/octet-stream";

    console.log(
      `📖 File preview: ${note.fileName} (${note.title}) by user: ${
        req.user || "anonymous"
      }`
    );

    // Set headers for inline viewing (not download)
    res.set({
      "Content-Disposition": "inline",
      "Content-Type": mimeType,
      "X-Frame-Options": "SAMEORIGIN",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    });

    // Redirect to Cloudinary URL for inline viewing
    res.redirect(note.fileUrl);
  } catch (err) {
    console.error("View error:", err);
    res.status(500).json({ message: "Server error while viewing file" });
  }
});
// Get user's uploaded notes
router.get("/user/my-notes", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notes = await Note.find({ uploader: req.user })
      .select("-cloudinaryId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Note.countDocuments({ uploader: req.user });

    res.json({
      notes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Get user notes error:", err);
    res.status(500).json({ message: "Server error while fetching user notes" });
  }
});

// Delete note (only by uploader)
router.delete("/:id", auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Check if user is the uploader
    if (note.uploader.toString() !== req.user) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this note" });
    }

    // Delete file from Cloudinary
    try {
      await cloudinary.uploader.destroy(note.cloudinaryId);
    } catch (cloudinaryError) {
      console.error("Cloudinary deletion error:", cloudinaryError);
    }

    // Delete from database
    await Note.findByIdAndDelete(req.params.id);

    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("Delete note error:", err);
    res.status(500).json({ message: "Server error while deleting note" });
  }
});

// Get departments with note counts
router.get("/stats/departments", async (req, res) => {
  try {
    const departments = await Note.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          latestNote: { $max: "$createdAt" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json(departments);
  } catch (err) {
    console.error("Get department stats error:", err);
    res
      .status(500)
      .json({ message: "Server error while fetching department stats" });
  }
});

module.exports = router;
