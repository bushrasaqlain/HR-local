const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.js");
const specialityController = require("../controller/specialityController.js")

router.post("/addspeciality", authMiddleware, specialityController.addSpeciality)

router.get("/getallspeciality", specialityController.getAllSpeciality)

router.put("/updatestatus/:id", authMiddleware, specialityController.updateStatus)

router.put("/editspeciality/:id", authMiddleware, specialityController.editSpeciality)

module.exports = router;
