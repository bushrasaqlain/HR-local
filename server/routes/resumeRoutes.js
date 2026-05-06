const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const resumeController = require("../controller/resumeController");
const resumeModel = require("../models/resumeModel"); // your uploadCV lives here now
const { uploadResume } = require("../middleware/upload");

// ✅ CV-only registration upload (parses + saves to candidate_info)
router.post(
  "/upload-cv",
  authMiddleware,
  uploadResume.single("resume"),
  resumeModel.uploadCV          // <-- was missing entirely
);

// Add resume (step 4 manual flow)
router.post(
  "/addresume",
  authMiddleware,
  uploadResume.single("resume"),
  resumeController.addResume
);

// Update resume
router.put(
  "/updateresume/:id",
  authMiddleware,
  uploadResume.single("resume"),
  resumeController.updateResume
);

// Get resume
router.get("/getresume", authMiddleware, resumeController.getResume);

module.exports = router;