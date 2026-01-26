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

router.get("/applicantsData/:userId", applicantController.getAllApplicants)
router.put("/updatestatus/:applicationId/:status",applicantController.updateApplcantStatus)

module.exports = router;