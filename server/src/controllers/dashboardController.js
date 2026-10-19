const Candidate = require("../models/Candidate");

exports.getDashboardStats = async (req, res) => {
  try {
    // Only count candidates belonging to the logged-in user.
    const userId = req.user.userId;

    // Total candidates owned by this user.
    const totalCandidates = await Candidate.countDocuments({
      userId,
    });

    // Count candidates in each hiring stage for this user.
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
        count: await Candidate.countDocuments({
          userId,
          stage,
        }),
      }))
    );

    // Active candidates exclude rejected and hired candidates.
    const activeCandidates = await Candidate.countDocuments({
      userId,
      stage: { $nin: ["Rejected", "Hired"] },
    });

    // Count candidates hired by this user.
    const hiredCandidates = await Candidate.countDocuments({
      userId,
      stage: "Hired",
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalCandidates,
        activeCandidates,
        hiredCandidates,
        stageStats,
      },
    });
  } catch (error) {
    console.error("Dashboard statistics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics.",
    });
  }
};