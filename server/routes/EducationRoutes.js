const express = require("express");
const router = express.Router();
const educationController = require("../controller/educationController");

router.get("/education/:user_id", educationController.getEducationByUserId);

router.get("/education-get/:id", educationController.getEducationById);

router.post("/education", educationController.addEducation);

router.put("/education/:id", educationController.updateEducation);

router.delete("/education/delete/:id", educationController.deleteEducation);

module.exports = router;
