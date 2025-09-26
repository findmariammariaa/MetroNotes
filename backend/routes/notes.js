const express = require("express");
const Note = require("../models/Note");
const auth = require("../middleware/authMiddleware");
const { upload, cloudinary } = require("../config/cloudinary");
const router = express.Router();
const axios = require("axios");
// === Upload Route ===
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    const cleanString = (str) => str?.replace(/^["']|["']$/g, "").trim();
    const {
      uploaderName,
      uploaderId,
      department,
      courseName,
      courseCode,
      title,
    } = req.body;

    const cleanedData = {
      uploaderName: cleanString(uploaderName),
      uploaderId: cleanString(uploaderId),
      department: cleanString(department),
      courseName: cleanString(courseName),
      courseCode: cleanString(courseCode),
      title: cleanString(title),
    };

    if (
      !cleanedData.department ||
      !cleanedData.courseName ||
      !cleanedData.courseCode ||
      !cleanedData.title
    )
      return res.status(400).json({
        message: "Department, course name, course code, and title are required",
      });

    if (!req.file)
      return res.status(400).json({ message: "Please upload a file" });

    const fileUrl = req.file.secure_url || req.file.path;
    const cloudinaryId = req.file.public_id || req.file.filename;

    if (!fileUrl || !cloudinaryId)
      return res
        .status(500)
        .json({ message: "File upload failed - missing file data" });

    const note = new Note({
      title: cleanedData.title,
      uploaderName: cleanedData.uploaderName || "Anonymous",
      uploaderId: cleanedData.uploaderId || req.user,
      department: cleanedData.department,
      courseName: cleanedData.courseName,
      courseCode: cleanedData.courseCode,
      fileUrl,
      fileName: req.file.originalname,
      cloudinaryId,
      uploader: req.user,
    });

    await note.save();

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
        uploaderName: note.uploaderName,
        uploaderId: note.uploaderId,
        downloadCount: note.downloadCount || 0,
      },
    });
  } catch (err) {
    if (req.file?.public_id || req.file?.filename) {
      try {
        await cloudinary.uploader.destroy(
          req.file.public_id || req.file.filename
        );
      } catch {}
    }
    res.status(500).json({ message: "Server error during upload" });
  }
});

// === Download Route (via streaming, preserves filename/extension) ===
router.get("/download/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    note.downloadCount = (note.downloadCount || 0) + 1;
    await note.save();

    const fileExtension =
      note.fileName.split(".").pop()?.toLowerCase() || "bin";
    const safeTitle = note.title
      .replace(/[^a-zA-Z0-9\s\-_]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);
    const downloadFileName = `${safeTitle}.${fileExtension}`;

    const response = await axios({
      method: "GET",
      url: note.fileUrl,
      responseType: "stream",
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${downloadFileName}"`
    );
    res.setHeader(
      "Content-Type",
      response.headers["content-type"] || "application/octet-stream"
    );
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    response.data.pipe(res);
  } catch (err) {
    console.error("Download error:", err.message);
    res.status(500).json({ message: "Server error while downloading file" });
  }
});

// === View Route ===
router.get("/view/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const fileExtension = note.fileName.split(".").pop()?.toLowerCase() || "";

    const viewableTypes = ["pdf", "txt", "jpg", "jpeg", "png", "gif"];
    const mimeTypes = {
      pdf: "application/pdf",
      txt: "text/plain; charset=utf-8",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
    };

    if (!viewableTypes.includes(fileExtension)) {
      return res.status(400).json({
        message:
          "File type not supported for viewing. Please download instead.",
        supportedTypes: viewableTypes,
      });
    }

    const mimeType = mimeTypes[fileExtension] || "application/octet-stream";

    res.set({
      "Content-Type": mimeType,
      "Content-Disposition": "inline",
      "X-Frame-Options": "SAMEORIGIN",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    });

    res.redirect(note.fileUrl);
  } catch (err) {
    console.error("View error:", err);
    res.status(500).json({ message: "Server error while viewing file" });
  }
});

// === Get All Notes with Filters ===
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

    const filter = {};
    if (department) filter.department = department;
    if (courseName) filter.courseName = { $regex: courseName, $options: "i" };
    if (courseCode) filter.courseCode = { $regex: courseCode, $options: "i" };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { courseName: { $regex: search, $options: "i" } },
        { courseCode: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const notes = await Note.find(filter)
      .populate("uploader", "name email studentId")
      .select("-cloudinaryId")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

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
    res.status(500).json({ message: "Server error while fetching notes" });
  }
});

// === Get Single Note by ID ===
router.get("/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate(
      "uploader",
      "name email studentId"
    );
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching note" });
  }
});

// === Get Notes by Department ===
router.get("/department/:department", async (req, res) => {
  try {
    const { department } = req.params;
    const { page = 1, limit = 10, search } = req.query;

    const filter = { department: department.replace(/\+/g, " ") };
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
    res
      .status(500)
      .json({ message: "Server error while fetching department notes" });
  }
});

// === Get User's Uploaded Notes ===
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
    res.status(500).json({ message: "Server error while fetching user notes" });
  }
});

// === Delete Note (by uploader only) ===
router.delete("/:id", auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.uploader.toString() !== req.user) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this note" });
    }

    try {
      await cloudinary.uploader.destroy(note.cloudinaryId);
    } catch (cloudErr) {
      console.error("Cloudinary deletion error:", cloudErr);
    }

    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error while deleting note" });
  }
});

// === Stats: Notes by Department ===
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
    res
      .status(500)
      .json({ message: "Server error while fetching department stats" });
  }
});

module.exports = router;
