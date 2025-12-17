const express = require("express");
const router = express.Router();
const connection = require("../connection.js");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger.js");
const bankController = require("../controller/bankController.js");


// Add Bank Name (CSV or Single)

router.post("/addbankname",bankController.addBank);


router.get("/getallbanknames",bankController.getAllBank);

router.delete("/deletebankname/:id", authMiddleware,bankController.deleteBank)


router.put("/editbankname/:id", authMiddleware,bankController.editBank);
module.exports = router;
