const degreefieldController = require("../controller/degreeFieldController");
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

router.post("/adddegreefield", authMiddleware, degreefieldController.addDegreeField);
router.put("/editdegreefield/:id", authMiddleware, degreefieldController.editDegreeField);
router.get("/getallDegreeFields", degreefieldController.getAllDegreeFields);
router.delete("/deleteDegreeField/:id", authMiddleware, degreefieldController.deleteDegreeField);
router.get("/getDegreeFieldsDropdown", degreefieldController.getDegreeFieldsDropdown);

module.exports = router;