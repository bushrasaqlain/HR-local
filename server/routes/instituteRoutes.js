const express = require("express");
const router = express.Router();
const connection = require("../connection.js");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger.js");
const instituteController = require("../controller/instituteController.js");


// Add Institute Name (CSV or Single)

router.post("/addInstitute",instituteController.addInstitute);


router.get("/getallInstitute",instituteController.getAllInstitute);

router.put("/updateStatus/:id/:status", authMiddleware,instituteController.updateStatus)


router.put("/editInstitute/:id", authMiddleware,instituteController.editInstitute);
module.exports = router;
