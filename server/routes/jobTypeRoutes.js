const express = require("express");
const router = express.Router();
const connection = require("../connection.js");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger.js");
const jobtypeController = require("../controller/jobtypeController.js");

router.post("/addjobtype", authMiddleware,jobtypeController.addjobtype )

router.get("/getalljobtypes",jobtypeController.getalljobtypes  )

router.delete("/deletejobtype/:id", authMiddleware,jobtypeController.deletejobtype )

router.put("/editjobtype/:id", authMiddleware, jobtypeController.editjobtype )

module.exports = router;
