const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.js");
const jobController=require('../controller/jobController')

router.get('/getJobbyRegAdmin',jobController.getJobbyRegAdmin)
router.put('/updateJobPostStatus/:id/:status',jobController.updateJobPostStatus)
router.get('/managejob/:userId',jobController.getAllJobs);

router.delete('/delete_job/:userId/:jobId',jobController.deleteJob)
router.get('/getSinglejob/:jobId',jobController.getSingleJob)
router.post('/postjob/:userId',jobController.postJob)
router.put('/updatejob/:userId/:jobId',jobController.updatePostJob)
router.put('/subcribepackage',jobController.subcribePackage)
router.get('/getjob/:userId',jobController.getJobTitle)
router.get("/gettotaljob/:userId",jobController.getTotalJobPosts);
router.get("/topCompanies/:limit?",jobController.getTopCompanies)

router.get("/popularcategories/:limit?",jobController.popularCategories)

router.get("/gettotaljob/:userId",jobController.getTotalJobPosts);

module.exports = router;