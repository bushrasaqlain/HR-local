const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const licensetypesController = require("../controller/licensetypesController");

router.post("/addLicenseType", authMiddleware, licensetypesController.addLicenseType);
router.put("/editLicenseType/:id", authMiddleware, licensetypesController.editLicenseType);
router.get("/getAllLicenseTypes", licensetypesController.getAllLicenseTypes);
router.delete("/deleteLicenseType/:id",authMiddleware,licensetypesController.deleteLicenseType);

module.exports = router;