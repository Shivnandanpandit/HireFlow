const Candidate = require("../models/Candidate");

exports.getDashboardStats = async (req, res) => {
  try {
    // Count all candidates
    const totalCandidates = await Candidate.countDocuments();

    // Count candidates currently in each hiring stage
    const stages = [
      "Applied",
      "Screening",
      "Interview",
      "Offer",
      "Hired",
      "Rejected",
    ];

    const stageStats = await Promise.all(
      stages.map(async (stage) => ({
        stage,
        count: await Candidate.countDocuments({ stage }),
      }))
    );

    // Active candidates exclude rejected and hired candidates
    const activeCandidates = await Candidate.countDocuments({
      stage: { $nin: ["Rejected", "Hired"] },
    });

    // Count hired candidates
    const hiredCandidates = await Candidate.countDocuments({
      stage: "Hired",
    });

    res.status(200).json({
      success: true,
      stats: {
        totalCandidates,
        activeCandidates,
        hiredCandidates,
        stageStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};