const express = require("express");
const router = express.Router();
const candidatejobsController = require("../controller/candidatejobsController");
const authMiddleware = require("../middleware/auth");


router.post("/savedjobs", candidatejobsController.toggleSavedJob);

router.get("/checkingsavedjobs/:userId", candidatejobsController.getSavedJobsByUser);

router.get("/savedjobscount/:userId", candidatejobsController.getSavedJobsCount);

router.get("/getsavedjobs", authMiddleware, candidatejobsController.getSavedJobsWithDetails);

router.get("/availablejobs", authMiddleware, candidatejobsController.getAvailableJobs);

router.get("/user-applications/:userId", candidatejobsController.getUserApplications);

router.get("/NewJobs", candidatejobsController.getNewJobs);

module.exports = router;


