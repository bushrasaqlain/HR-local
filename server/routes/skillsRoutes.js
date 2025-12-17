const express = require("express");
const router = express.Router();
const countryController = require("../controller/countryController");
const authMiddleware = require("../middleware/auth");
const skillsController = require("../controller/skillsController");

router.post("/addskill", authMiddleware, skillsController.addSkill);
router.put("/editskill/:id", authMiddleware, skillsController.editSkill);
router.get("/getallskills", skillsController.getAllSkills);
router.delete("/deleteskill/:id", authMiddleware, skillsController.deleteSkill);


module.exports = router;