const express = require("express");
const router = express.Router();
const connection = require("../connection.js");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger.js");
const jobtypeController = require("../controller/jobtypeController.js");

// ➤ Add Jobtype (CSV + Single)
router.post("/addjobtype", authMiddleware,jobtypeController.addjobtype )

// ➤ Get All Jobtypes with pagination + search
router.get("/getalljobtypes",jobtypeController.getalljobtypes  )
// ➤ Toggle Jobtype Status (soft delete)
router.delete("/deletejobtype/:id", authMiddleware,jobtypeController.deletejobtype )

// ➤ Edit Jobtype
router.put("/editjobtype/:id", authMiddleware, jobtypeController.editjobtype )

module.exports = router;
