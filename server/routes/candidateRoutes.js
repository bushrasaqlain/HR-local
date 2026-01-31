

const express = require("express");
const router = express.Router();
const connection = require("../connection");
const multer = require("multer");
const { route } = require("./accountRoutes");
const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const logAudit = require("../utils/auditLogger");
const candidateController = require("../controller/candidateController.js");
const upload = require("../middleware/upload"); // <--- Add this line
const { uploadPassportPhoto, uploadResume } = require("../middleware/upload");


const storage = multer.memoryStorage(); // Use memory storage for handling base64
const logo = multer({ 
  storage: storage,  limits: { fileSize: 100 * 1024 * 1024 },
});

// const authMiddleware = require("../middleware/auth.js");

// Add candidate info with passport photo and resume
// Step 1: Upload passport photo
router.post(
  "/candidate/passport-photo",
  authMiddleware,
  uploadPassportPhoto.single("passport_photo"),
  candidateController.addCandidateInfo
);

// // Step 4: Upload resume
// router.post(
//   "/candidate/resume",
//   authMiddleware,
//   uploadResume.single("resume"),
//   candidateController.addResume
// );

// Edit candidate info with passport photo and resume
router.put(
"/candidate/:accountId",
authMiddleware,
uploadPassportPhoto.single("passport_photo"),
uploadResume.single("resume"),
candidateController.editCandidateInfo
);

router.get("/candidate/", authMiddleware , candidateController.getCandidateInfo)


// update canidate data
// router.put("/candidate/:accountId", authMiddleware, logo.single("logo"), candidateController.editCandidateInfo);

router.get("/:accountId",candidateController.getCandidateFullProfilebyId )

router.get("/logo/:accountId",candidateController.getCandidateLogobyId)

router.get("/candidate/full_profile/:accountId",candidateController.getCandidateFullProfilebyId )


router.get("/", candidateController.getCandidateInfobyAccountType)

module.exports = router;
