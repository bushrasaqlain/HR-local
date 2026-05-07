const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.js");
const creditController = require("../controller/creditController");
 
// Get employer's active credit balance
router.get("/balance", authMiddleware, creditController.getEmployerCreditBalance);
 
// Unlock a candidate profile (deducts 1 credit)
router.post("/unlock", authMiddleware, creditController.unlockCandidateProfile);
 
// Get unlocked candidate data (scope enforced)
router.get("/profile/:candidate_id", authMiddleware, creditController.getUnlockedCandidateData);
 
// Get all unlocked candidates for this employer
router.get("/unlocked-list", authMiddleware, creditController.getUnlockedCandidatesList);
 
module.exports = router;