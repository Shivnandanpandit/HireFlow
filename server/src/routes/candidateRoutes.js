const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  updateCandidateStage,
  deleteCandidate,
} = require("../controllers/candidateController");

// All candidate endpoints require authentication
router.use(protect);

router.route("/")
  .get(getCandidates)
  .post(createCandidate);

router.route("/:id")
  .get(getCandidateById)
  .put(updateCandidate)
  .delete(deleteCandidate);

router.patch("/:id/stage", updateCandidateStage);

module.exports = router;