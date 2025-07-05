const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: 2,
      maxLength: 50,
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Updated validation for 3-3-3 digit format
      validate: {
        validator: function (v) {
          return /^\d{3}-\d{3}-\d{3}$/.test(v);
        },
        message: "Student ID must be in format XXX-XXX-XXX (e.g., 222-115-234)",
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^[\+]?[\d]{10,15}$/.test(v);
        },
        message: "Please provide a valid phone number",
      },
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Updated pre-save middleware to handle the new format
UserSchema.pre("save", function (next) {
  if (this.studentId) {
    // Remove any spaces and ensure proper format
    this.studentId = this.studentId.replace(/\s/g, "");

    // Validate format before saving
    if (!/^\d{3}-\d{3}-\d{3}$/.test(this.studentId)) {
      const err = new Error("Student ID must be in format XXX-XXX-XXX");
      err.name = "ValidationError";
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
