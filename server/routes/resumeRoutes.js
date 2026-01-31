const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const resumeController = require("../controller/resumeController");
const { uploadResume } = require("../middleware/upload"); // ✅ import from middleware

// Upload resume
router.post("/addresume", authMiddleware, uploadResume.single("resume"), resumeController.addResume);

// Get resume
router.get("/getresume", authMiddleware, resumeController.getResume);

module.exports = router;