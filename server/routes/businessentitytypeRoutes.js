const express = require("express");
const router = express.Router();
const connection = require("../connection.js");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger.js");
const businessentitytypeController = require("../controller/businessentitytypeController.js");
// ✅ Create table with status, timestamps


// ✅ Add Business Entity Type
router.post("/addbusinesstype", authMiddleware,businessentitytypeController.addbusinessentitytype)
// ✅ Get all with pagination + search + status filter
router.get("/getallbusinesstypes",businessentitytypeController.getAllbusinessentitytype)

// ✅ Soft delete (toggle active/inactive)
router.delete("/deletebusinesstype/:id", authMiddleware,businessentitytypeController.deletebusinessentitytype )

// ✅ Edit (name change)
router.put("/editbusinesstype/:id", authMiddleware,businessentitytypeController.editbusinessentitytype)

module.exports = router;
