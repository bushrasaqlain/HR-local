const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const researchController = require("../controller/candidateresearchController");
const { uploadResearch } = require("../middleware/upload");

// ------------------- Routes -------------------

// Add research (link or document required)
router.post(
  "/addresearch",
  authMiddleware,
  uploadResearch.single("file"), // Handle single file upload
  researchController.addcandidateResearch
);

// Update research (link or document required)
router.put(
  "/updateresearch/:id",
  authMiddleware,
  uploadResearch.single("file"),
  researchController.editcandidateResearch
);

// Get all research for the logged-in candidate
router.get("/getresearch", authMiddleware, researchController.getcandidateResearch);

// Delete a research entry
router.delete(
  "/deleteresearch/:id",
  authMiddleware,
  researchController.deletecandidateResearch
);

module.exports = router;
