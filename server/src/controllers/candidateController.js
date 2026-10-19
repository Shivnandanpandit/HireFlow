const Candidate = require("../models/Candidate");

// Handle duplicate email and Mongoose validation errors
function handleCandidateError(error, res) {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A candidate with this email already exists in your workspace.",
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

// GET: Retrieve only the logged-in user's candidates
exports.getCandidates = async (req, res) => {
  try {
    const { search, stage, position } = req.query;

    const filter = {
      userId: req.user.userId,
    };

    if (search) {
      filter.$and = [
        {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    if (stage) {
      filter.stage = stage;
    }

    if (position) {
      filter.position = { $regex: position, $options: "i" };
    }

    const candidates = await Candidate.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: candidates.length,
      candidates,
    });
  } catch (error) {
    return handleCandidateError(error, res);
  }
};

// GET: Retrieve one candidate belonging to the logged-in user
exports.getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found.",
      });
    }

    return res.status(200).json({
      success: true,
      candidate,
    });
  } catch (error) {
    return handleCandidateError(error, res);
  }
};

// POST: Create a candidate owned by the logged-in user
exports.createCandidate = async (req, res) => {
  try {
    const { name, email, position } = req.body;

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

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const existingCandidate = await Candidate.findOne({
      userId: req.user.userId,
      email: normalizedEmail,
    });

    if (existingCandidate) {
      return res.status(409).json({
        success: false,
        message: "A candidate with this email already exists in your workspace.",
      });
    }

    // Never accept the owner ID from the request body.
    // Ownership must come from the verified JWT.
    const {
      userId: ignoredUserId,
      _id: ignoredId,
      ...candidateData
    } = req.body;

    const candidate = await Candidate.create({
      ...candidateData,
      userId: req.user.userId,
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

// PUT: Update only a candidate owned by the logged-in user
exports.updateCandidate = async (req, res) => {
  try {
    const { name, email, position, experience } = req.body;

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

    if (name !== undefined) req.body.name = name.trim();
    if (position !== undefined) req.body.position = position.trim();

    // Do not allow a client to change candidate ownership.
    const {
      userId: ignoredUserId,
      _id: ignoredId,
      ...updateData
    } = req.body;

    const candidate = await Candidate.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId,
      },
      updateData,
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

// PATCH: Update the stage of an owned candidate
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
        message: "Invalid hiring stage.",
      });
    }

    const candidate = await Candidate.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId,
      },
      { stage },
      { new: true, runValidators: true },
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hiring stage updated successfully.",
      candidate,
    });
  } catch (error) {
    return handleCandidateError(error, res);
  }
};

// DELETE: Delete only a candidate owned by the logged-in user
exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Candidate deleted successfully.",
    });
  } catch (error) {
    return handleCandidateError(error, res);
  }
};