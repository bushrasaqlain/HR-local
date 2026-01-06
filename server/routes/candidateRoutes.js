

const multer = require("multer");
const express = require("express");
const router = express.Router();
const candidateController = require("../controller/candidateController.js");

const storage = multer.memoryStorage(); // Use memory storage for handling base64
const logo = multer({ 
  storage: storage,  limits: { fileSize: 100 * 1024 * 1024 },
});

const authMiddleware = require("../middleware/auth.js");

// Create the candidate_info table in the database

router.get("/getallCandidates",candidateController.getAllCandidates)
router.put("/updateStatus/:id/:status",candidateController.updateStatus)






// router.post("/availability",candidateController.addAvailaibility)

// router.post("/", logo.single("logo"), candidateController.addCandidateInfo)


// router.get("/candidate/", authMiddleware , candidateController.getCandidateInfo)


// // update canidate data
// router.put("/candidate/",authMiddleware , logo.single("logo"), candidateController.getCandidateInfobyId)


// router.get("/:accountId",candidateController.getCandidateFullProfilebyId )

// router.get("/logo/:accountId",candidateController.getCandidateLogobyId)

// router.get("/candidate/full_profile/:accountId",candidateController.getCandidateFullProfilebyId )


// router.get("/", candidateController.getCandidateInfobyAccountType)

module.exports = router;
