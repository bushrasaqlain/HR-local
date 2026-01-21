const express = require("express");
const router = express.Router();
const candidateeducationController = require("../controller/candidateeducationController");
const authMiddleware = require("../middleware/auth");

router.post("/addcandidateeducation", authMiddleware, candidateeducationController.addcandidateeducation);
router.put("/editcandidateeducation/:id", authMiddleware, candidateeducationController.editcandidateeducation);
router.get("/getallcandidateeducation", candidateeducationController.getAllcandidateeducation);
router.delete("/deletecandidateeducation/:id", authMiddleware,candidateeducationController.deletecandidateeducation);


module.exports = router;