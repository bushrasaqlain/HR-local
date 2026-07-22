const express = require("express");
const router = express.Router();
const screeningController = require("../controller/screeningController");
const authMiddleware = require("../middleware/auth");


router.post("/jobs/:jobId/screening-questions", screeningController.addScreeningQuestions);
router.get("/jobs/:jobId/screening-questions", screeningController.getScreeningQuestions);
router.delete("/screening-questions/:questionId", screeningController.deleteScreeningQuestion);
router.get("/applications/:applicationId/answers", screeningController.getApplicationAnswers);


module.exports = router;