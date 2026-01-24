

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


const storage = multer.memoryStorage(); // Use memory storage for handling base64
const logo = multer({ 
  storage: storage,  limits: { fileSize: 100 * 1024 * 1024 },
});

// const authMiddleware = require("../middleware/auth.js");


// router.post("/", logo.single("logo"), candidateController.addCandidateInfo)
router.post("/candidate/",  authMiddleware, upload.single("passport_photo"), candidateController.addCandidateInfo);

router.put("/candidate/:accountId", authMiddleware, upload.single("passportPhoto"), candidateController.editCandidateInfo);


router.get("/candidate/", authMiddleware , candidateController.getCandidateInfo)


// update canidate data
// router.put("/candidate/:accountId", authMiddleware, logo.single("logo"), candidateController.editCandidateInfo);

// router.get("/:accountId",candidateController.getCandidateFullProfilebyId )

router.get("/logo/:accountId",candidateController.getCandidateLogobyId)

// router.get("/candidate/full_profile/:accountId",candidateController.getCandidateFullProfilebyId )


router.get("/", candidateController.getCandidateInfobyAccountType)
router.get("/getallcandidates", candidateController.getAllCandidates)

module.exports = router;
