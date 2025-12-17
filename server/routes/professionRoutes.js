const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.js");
const professionController = require("../controller/professionController.js")

router.post("/addprofession", authMiddleware, professionController.addProfession)

router.get("/getallprofessions", professionController.getAllProfession)

router.delete("/deleteprofession/:id", authMiddleware, professionController.deleteProfession)

router.put("/editprofession/:id", authMiddleware, professionController.editProfession)

module.exports = router;
