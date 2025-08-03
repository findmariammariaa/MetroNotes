const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const path = require("path");

// Validate environment variables before configuring Cloudinary
const requiredEnvVars = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(
    "❌ Missing required Cloudinary environment variables:",
    missingVars
  );
  console.error(
    "Please check your .env file and ensure these variables are set:"
  );
  missingVars.forEach((varName) => {
    console.error(`  - ${varName}`);
  });
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify Cloudinary configuration
console.log("=== CLOUDINARY CONFIGURATION ===");
console.log("Cloud Name:", cloudinary.config().cloud_name);
console.log("API Key:", cloudinary.config().api_key ? "✅ SET" : "❌ MISSING");
console.log(
  "API Secret:",
  cloudinary.config().api_secret ? "✅ SET" : "❌ MISSING"
);
console.log("================================");

// Test Cloudinary connection
cloudinary.api
  .ping()
  .then(() => {
    console.log("✅ Cloudinary connection successful");
  })
  .catch((error) => {
    console.error("❌ Cloudinary connection failed:", error.message);
  });

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "metronotes",
    resource_type: "raw",
    allowed_formats: [
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
    public_id: (req, file) => {
      const name = path.parse(file.originalname).name; // file name without extension
      const ext = path.extname(file.originalname).slice(1); // file extension
      return `${name}_${Date.now()}.${ext}`; // full file name with extension
    },
  },
});

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, DOCX, TXT, PPT, PPTX, JPG, JPEG, PNG files are allowed."
        ),
        false
      );
    }
  },
});

module.exports = {
  cloudinary,
  upload,
};
