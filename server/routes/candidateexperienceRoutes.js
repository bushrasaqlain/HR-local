const express = require("express");
const router = express.Router();
const multer = require("multer");
const authMiddleware = require("../middleware/auth");
const connection = require("../connection");
const experienceController=require("../controller/candidateexperienceController")
// Configure multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/addexperience',authMiddleware,experienceController.addcandidateExperience );


router.put('/updateexperience/:id', experienceController.editcandidateeducation);


router.get("/getexperience",authMiddleware,experienceController.getcandidateExperience);

router.delete('/deleteexperience/:id',experienceController.deletecandidateExperience );
module.exports = router;
