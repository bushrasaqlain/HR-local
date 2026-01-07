const express = require("express");
const router = express.Router();

const jobController=require('../controller/jobController')


router.get('/managejob/:userId',jobController.getAllJobs);

router.delete('/delete_job/:userId/:jobId',jobController.deleteJob)
router.get('/getSinglejob/:jobIdFromUrl',jobController.getSingleJob)
router.post('/postjob/:userId',jobController.postJob)
router.put('/subcribepackage',jobController.subcribePackage)
router.get('/getpostjobcount/:userId',jobController.getJobPostCount)
module.exports = router;