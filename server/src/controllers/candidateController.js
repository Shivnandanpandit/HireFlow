const Candidate = require("../models/Candidate");
// Handle duplicate email and Mongoose validation errors
function handleCandidateError(error, res) {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A candidate with this email already exists.",
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid candidate data or ID.",
    });
  }

  console.error("Candidate controller error:", error);

  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
}

// GET: Retrieve all candidates with optional search and filtering
exports.getCandidates = async (req, res) => {
  try {
    const { search, stage, position } = req.query;

    const filter = {};

    // Search candidates by name or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by hiring stage
    if (stage) {
      filter.stage = stage;
    }

    // Filter by job position
    if (position) {
      filter.position = { $regex: position, $options: "i" };
    }

    const candidates = await Candidate.find(filter).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: candidates.length,
      candidates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET: Retrieve one candidate by ID
exports.getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.status(200).json({
      success: true,
      candidate,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid candidate ID",
    });
  }
};

// POST: Create a new candidate
// POST: Create a new candidate
exports.createCandidate = async (req, res) => {
  try {
    const { name, email, position } = req.body;

    // Validate required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof position !== "string" ||
      !position.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and position are required.",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // Normalize email before checking for duplicates
    const normalizedEmail = email.trim().toLowerCase();

    const existingCandidate = await Candidate.findOne({
      email: normalizedEmail,
    });

    if (existingCandidate) {
      return res.status(409).json({
        success: false,
        message: "A candidate with this email already exists.",
      });
    }

    // Create candidate; the unique index also protects against race conditions
    const candidate = await Candidate.create({
      ...req.body,
      name: name.trim(),
      email: normalizedEmail,
      position: position.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Candidate created successfully.",
      candidate,
    });
  } catch (error) {
    return handleCandidateError(error, res);
  }
};

// PUT: Update candidate details
exports.updateCandidate = async (req, res) => {
  try {
    const { name, email, position, experience } = req.body;

    // Validate provided required fields
    if (
      (name !== undefined && (typeof name !== "string" || !name.trim())) ||
      (email !== undefined && (typeof email !== "string" || !email.trim())) ||
      (position !== undefined &&
        (typeof position !== "string" || !position.trim()))
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and position cannot be empty.",
      });
    }

    // Validate email when provided
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address.",
        });
      }

      req.body.email = email.trim().toLowerCase();
    }

    // Validate experience when provided
    if (experience !== undefined) {
      const numericExperience = Number(experience);

      if (
        experience === null ||
        (typeof experience === "string" && !experience.trim()) ||
        !Number.isFinite(numericExperience) ||
        numericExperience < 0 ||
        numericExperience > 60 ||
        numericExperience * 2 !== Math.round(numericExperience * 2)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Experience must be between 0 and 60 years in 0.5-year increments.",
        });
      }

      req.body.experience = numericExperience;
    }

    // Normalize supplied text fields
    if (name !== undefined) req.body.name = name.trim();
    if (position !== undefined) req.body.position = position.trim();

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Candidate updated successfully.",
      candidate,
    });
  } catch (error) {
    return handleCandidateError(error, res);
  }
};

// PATCH: Update hiring stage
exports.updateCandidateStage = async (req, res) => {
  try {
    const { stage } = req.body;

    const validStages = [
      "Applied",
      "Screening",
      "Interview",
      "Offer",
      "Hired",
      "Rejected",
    ];

    if (!validStages.includes(stage)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hiring stage",
      });
    }

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { stage },
      { new: true, runValidators: true },
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Hiring stage updated successfully",
      candidate,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid candidate ID",
    });
  }
};

// DELETE: Delete a candidate
exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Candidate deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid candidate ID",
    });
  }
};
