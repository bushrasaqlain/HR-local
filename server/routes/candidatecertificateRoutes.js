const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const certificateController = require("../controller/candidatecertificateController");
const { uploadCertificate } = require("../middleware/upload");

// ------------------- Routes -------------------

// Add certificate (link or document required)
router.post(
  "/addcertificate",
  authMiddleware,
  uploadCertificate.single("file"), // Handle single file upload
  certificateController.addcandidateCertificate
);

// Update certificate (link or document required)
router.put(
  "/updatecertificate/:id",
  authMiddleware,
  uploadCertificate.single("file"),
  certificateController.editcandidateCertificate
);

// Get all certificate for the logged-in candidate
router.get("/getcertificate", authMiddleware, certificateController.getcandidateCertificate);

// Delete a certificate entry
router.delete(
  "/deletecertificate/:id",
  authMiddleware,
  certificateController.deletecandidateCertificate
);

module.exports = router;
