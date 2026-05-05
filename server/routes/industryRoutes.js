const express = require("express");
const router = express.Router();
const connection = require("../connection.js");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger.js");
const industryController = require("../controller/industryController.js");

router.post("/addindustry", authMiddleware,industryController.addindustry )

router.get("/getallindustry",industryController.getallindustry  )

router.delete("/deleteindustry/:id", authMiddleware,industryController.deleteindustry )

router.put("/editindustry/:id", authMiddleware, industryController.editindustry )

module.exports = router;
