const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Candidate name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    position: {
      type: String,
      required: [true, "Job position is required"],
      trim: true,
      maxlength: [100, "Position cannot exceed 100 characters"],
    },

    experience: {
      type: Number,
      min: [0, "Experience cannot be negative"],
      max: [60, "Experience cannot exceed 60 years"],
      default: 0,
      validate: {
        validator: function (value) {
          return Number.isFinite(value) &&
            Math.round(value * 2) === value * 2;
        },
        message: "Experience must use increments of 0.5 years",
      },
    },

    skills: {
      type: [String],
      default: [],
    },

    stage: {
      type: String,
      enum: [
        "Applied",
        "Screening",
        "Interview",
        "Offer",
        "Hired",
        "Rejected",
      ],
      default: "Applied",
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate email addresses at the database level.
candidateSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("Candidate", candidateSchema);