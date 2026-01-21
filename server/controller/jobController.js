
const jobModel = require("../models/jobModel");

const getJobbyRegAdmin = (req, res) => {
  jobModel.getJobbyRegAdmin(req, res);
}
const updateJobPostStatus = (req, res) => {
  jobModel.updateJobPostStatus(req, res);
}

const getAllJobs = (req, res) => {
  jobModel.getAllJobs(req, res);
}
const deleteJob = (req, res) => {
  jobModel.deleteJob(req, res)
}
const getSingleJob = (req, res) => {
  jobModel.getSingleJob(req, res);
}

const postJob = (req, res) => {
  jobModel.postJob(req, res);
}
const updatePostJob = (req, res) => {
  jobModel.updatePostJob(req, res)
}

const subcribePackage = (req, res) => {
  jobModel.subcribePackage(req, res);
}

const getJobTitle=(req,res)=>{
  jobModel.getJobTitle(req,res);
}


module.exports = {
  getJobbyRegAdmin,
  updateJobPostStatus,
  getAllJobs,
  getSingleJob,
  deleteJob,
  postJob,
  subcribePackage,
  updatePostJob,
  getJobTitle
}