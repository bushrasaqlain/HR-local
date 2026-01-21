const express = require("express");
const router = express.Router();
const connection = require("../connection.js");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger.js");
const businessentitytypeController = require("../controller/businessentitytypeController.js");

router.post("/addbusinesstype", authMiddleware,businessentitytypeController.addbusinessentitytype)

router.get("/getallbusinesstypes",businessentitytypeController.getAllbusinessentitytype)


router.delete("/deletebusinesstype/:id", authMiddleware,businessentitytypeController.deletebusinessentitytype )


router.put("/editbusinesstype/:id", authMiddleware,businessentitytypeController.editbusinessentitytype)

module.exports = router;
