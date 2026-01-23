const express = require("express");
const router = express.Router();
const candidateeducationController = require("../controller/candidateeducationController");
const authMiddleware = require("../middleware/auth");
const multer = require("multer");

router.post("/addcandidateeducation", authMiddleware, candidateeducationController.addcandidateeducation);
router.put("/editcandidateeducation", authMiddleware, candidateeducationController.editcandidateeducation);
router.get("/getallcandidateeducation", authMiddleware,candidateeducationController.getallcandidateeducation);
router.delete("/deletecandidateeducation/:id", authMiddleware, candidateeducationController.deletecandidateeducation);


module.exports = router;