const express = require("express");
const router = express.Router();
const connection = require("../connection.js");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger.js");
const jobtitleController = require("../controller/jobtitleController.js");

router.post("/addJobTitle", authMiddleware,jobtitleController.addJobTitle )

router.get("/getAllJobTitles",jobtitleController.getAllJobTitles  )

router.delete("/deleteJobTitles/:id", authMiddleware,jobtitleController.deleteJobTitles )

router.put("/editJobTitles/:id", authMiddleware, jobtitleController.editJobTitles )

module.exports = router;
