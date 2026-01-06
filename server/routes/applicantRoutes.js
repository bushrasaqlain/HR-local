const express = require("express");
const router = express.Router();
const connection = require("../connection.js");

const authMiddleware = require("../middleware/auth.js");
const applicantController = require("../controller/applicantController.js");
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },

});

router.get("/applicantsData/:userId/:status", applicantController.getAllApplicants)
router.put("/ShortListedApplicants/:applicationId",applicantController.updateShortListedbyId)
router.put("/ApprovedApplicatns/:applicationId",applicantController.updateApproveApplicant);
module.exports = router;