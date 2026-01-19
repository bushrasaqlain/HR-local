const express = require("express");
const router = express.Router();
const connection = require("../connection");
const multer = require("multer");
const { route } = require("./accountRoutes");
const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const logAudit = require("../utils/auditLogger");
const storage = multer.memoryStorage(); // Use memory storage for handling base64
const logo = multer({
  storage: storage, limits: { fileSize: 100 * 1024 * 1024 },
});

const companyController=require('../controller/companyController')

router.get("/getcompanybyid/:userId", companyController.getcompanybyid);

router.get("/getallcompanies",companyController.getAllCompanies);


router.put("/updateCompanyinfo", logo.single("logo"), companyController.updateCompanyinfo);

router.put("/updateStatus/:id/:status",companyController.updateCompanySatus)

router.get("/getCount/:userId",companyController.getCount)
module.exports = router;